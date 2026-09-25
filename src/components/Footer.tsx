"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type Layer = { base: number; amp: number; wl: number; speed: number; dir: 1 | -1; phase: number };

// back to front. `base` is a fraction of the footer's height, so the sea
// scales with the viewport; the robot rides layer index ROBOT_LAYER.
export const LAYERS: Layer[] = [
  { base: 0.36, amp: 2, wl: 620, speed: 0.16, dir: 1, phase: 0 },
  { base: 0.46, amp: 4, wl: 520, speed: 0.22, dir: -1, phase: 1.7 },
  { base: 0.6, amp: 6.5, wl: 440, speed: 0.28, dir: 1, phase: 3.1 },
  { base: 0.76, amp: 9, wl: 380, speed: 0.34, dir: -1, phase: 4.6 },
];
const ROBOT_LAYER = 2;
const STEP = 14;

// a small spiral for the robot's eyes when it gets dizzy
const SPIRAL = (() => {
  let d = "";
  for (let a = 0; a <= Math.PI * 4; a += 0.4) {
    const r = (a / (Math.PI * 4)) * 5.5;
    d += `${d ? "L" : "M"}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  }
  return d;
})();

// Fish silhouettes drifting through the deep water. Everything is derived from the
// index so server and client render the same; the sizes, depths, speeds and
// directions are spread so no two look alike. A few small ones swim as a school.
const FISH = Array.from({ length: 11 }, (_, i) => ({
  y: 6 + ((i * 47) % 84),
  size: 24 + ((i * 29) % 34),
  dur: 34 + ((i * 13) % 30),
  delay: -((i * 17) % 60),
  left: i % 3 !== 0, // which way it is heading
  shape: i % 2,
  school: i % 4 === 1,
}));

type BotPart = "body" | "face" | "light";

// the robot floats in an inflatable ring round its waist: the far half is drawn
// behind the body and the near half in front, so it reads as a ring in the water
const TUBE_BACK = "M-42 -8A42 11 0 0 1 42 -8";
const TUBE_FRONT = "M-42 -8A42 11 0 0 0 42 -8";
function TubeArc({ d, back }: { d: string; back?: boolean }) {
  return (
    <g className={back ? "bot-tube back" : "bot-tube"}>
      <path className="tube-edge" d={d} />
      <path className="tube-base" d={d} />
      <path className="tube-stripes" d={d} />
      <path className="tube-shine" d={d} transform="translate(0 -2.6)" />
    </g>
  );
}
const SLICES = 46;

// a long, slow swell plus a smaller cross-swell running the other way: calm,
// but never a single repeating sine
export function waveY(l: Layer, x: number, t: number, h: number) {
  const k = (Math.PI * 2) / l.wl;
  return (
    h * l.base +
    l.amp * Math.sin(x * k + l.dir * t * l.speed * 2 + l.phase) +
    l.amp * 0.3 * Math.sin(x * k * 2.3 - l.dir * t * l.speed * 2.4 + l.phase * 2)
  );
}

/**
 * Tall sea footer: four layered, continuously moving waves in warm tones.
 * A robot rides the third layer, tilting with its slope. By day the sun
 * sits on the horizon; at night the moon rises with a shimmering reflection
 * on the water and the robot's antenna light blinks. Colours all come from
 * CSS variables, so it follows the theme.
 */
export default function Footer({ children }: { children?: ReactNode }) {
  const reduced = useReducedMotion();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const robotRef = useRef<SVGGElement>(null);
  const sliceRefs = useRef<(SVGRectElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0, cx: 0 });

  // The robot reacts to being poked, and which part you poke picks the reaction:
  // body: giggles, face: gets dizzy (smacked), antenna light: bounces. The moves are
  // driven through a small state object so they never fight the wave-riding transform.
  const bodyGRef = useRef<SVGGElement>(null);
  const headGRef = useRef<SVGGElement>(null);
  const lightGRef = useRef<SVGGElement>(null);
  const haloGRef = useRef<SVGGElement>(null);
  const armLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const playRef = useRef<gsap.core.Timeline | null>(null);
  const deepRef = useRef<HTMLDivElement>(null);
  const sharkRef = useRef<HTMLDivElement>(null);
  const sharkSvgRef = useRef<SVGSVGElement>(null);
  const botState = useRef({ headRot: 0, bodyRot: 0, bodyY: 0, armL: 0, armR: 0, lightY: 0, halo: 1 });

  const renderBot = () => {
    const s = botState.current;
    bodyGRef.current?.setAttribute("transform", `translate(0 ${s.bodyY.toFixed(2)}) rotate(${s.bodyRot.toFixed(2)} 0 34)`);
    headGRef.current?.setAttribute("transform", `rotate(${s.headRot.toFixed(2)} 0 -46)`);
    lightGRef.current?.setAttribute("transform", `translate(0 ${s.lightY.toFixed(2)})`);
    haloGRef.current?.setAttribute("transform", `translate(0 -116) scale(${s.halo.toFixed(3)}) translate(0 116)`);
    armLRef.current?.setAttribute("transform", `rotate(${s.armL.toFixed(2)} -30 -36)`);
    armRRef.current?.setAttribute("transform", `rotate(${s.armR.toFixed(2)} 30 -36)`);
  };

  const poke = (part: BotPart) => {
    const bot = robotRef.current;
    if (reduced || !bot) return;
    const s = botState.current;
    const settle = () => {
      Object.assign(s, { headRot: 0, bodyRot: 0, bodyY: 0, armL: 0, armR: 0, lightY: 0, halo: 1 });
      bot.classList.remove("dizzy", "flash", "giggle");
      renderBot();
    };
    playRef.current?.kill();
    settle();

    const tl = gsap.timeline({ onUpdate: renderBot, onComplete: settle });
    if (part === "body") {
      // giggle: a quick shake with the arms flapping, eyes squeezed into happy arcs
      bot.classList.add("giggle");
      for (let i = 0; i < 16; i++) {
        const on = i % 2 === 0;
        tl.to(s, {
          bodyRot: on ? 3.5 : -3.5,
          bodyY: on ? -2.5 : 0,
          armL: on ? -20 : 6,
          armR: on ? -6 : 20,
          duration: 0.075,
          ease: "sine.inOut",
        });
      }
      tl.to(s, { bodyRot: 0, bodyY: 0, armL: 0, armR: 0, duration: 0.15 });
    } else if (part === "face") {
      // dizzy: the head is smacked sideways, wobbles back, eyes turn to spirals
      bot.classList.add("dizzy");
      tl.to(s, { headRot: 24, bodyRot: -3, duration: 0.06, ease: "power3.out" });
      [-16, 11, -7, 4, -2, 0].forEach((v) => tl.to(s, { headRot: v, bodyRot: 0, duration: v === 0 ? 0.25 : 0.17, ease: "sine.inOut" }));
      tl.to({}, { duration: 0.7 });
    } else {
      // the antenna light pops up and bounces back down, flashing
      bot.classList.add("flash");
      tl.to(s, { lightY: -30, halo: 2.6, duration: 0.18, ease: "power2.out" });
      tl.to(s, { lightY: 0, halo: 1, duration: 1.1, ease: "bounce.out" });
    }
    playRef.current = tl;
  };

  useEffect(() => () => void playRef.current?.kill(), []);

  // While the deep water is on screen a shark crosses it every 30 seconds, at a random
  // depth, heading left or right at random. The first one comes a couple of seconds in.
  useEffect(() => {
    const deep = deepRef.current;
    const shark = sharkRef.current;
    const svg = sharkSvgRef.current;
    if (!deep || !shark || !svg || reduced) return;
    let first: ReturnType<typeof setTimeout> | undefined;
    let every: ReturnType<typeof setInterval> | undefined;
    let swim: Animation | undefined;

    const spawn = () => {
      const toRight = Math.random() < 0.5;
      shark.style.top = `${12 + Math.random() * 68}%`;
      // the drawing faces left, so flip it when it is heading right
      svg.style.transform = toRight ? "scaleX(-1)" : "none";
      const [from, to] = toRight ? ["-30vw", "125vw"] : ["125vw", "-30vw"];
      swim?.cancel();
      swim = shark.animate(
        [
          { transform: `translateX(${from})`, opacity: 1 },
          { transform: `translateX(${to})`, opacity: 1 },
        ],
        { duration: 12000 + Math.random() * 4000, easing: "linear" }
      );
    };

    const io = new IntersectionObserver(([entry]) => {
      clearTimeout(first);
      clearInterval(every);
      if (!entry.isIntersecting) return;
      first = setTimeout(() => {
        spawn();
        every = setInterval(spawn, 30000);
      }, 2500);
    });
    io.observe(deep);

    return () => {
      io.disconnect();
      clearTimeout(first);
      clearInterval(every);
      swim?.cancel();
    };
  }, [reduced]);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    // the light source is the sun/moon icon in the theme toggle, so the
    // reflection lines up with wherever that button sits on screen
    const measure = () => {
      const w = el.clientWidth;
      const toggle = document.querySelector(".theme-toggle");
      const cx = toggle ? toggle.getBoundingClientRect().left + toggle.clientWidth / 2 : w * 0.74;
      setSize({ w, h: el.clientHeight, cx });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = surfaceRef.current;
    const { w, h, cx: celX } = size;
    if (!el || !w || !h) return;

    const robotX = w * (w < 700 ? 0.3 : 0.24);
    const robotScale = w < 700 ? 0.8 : 1;

    const draw = (t: number) => {
      LAYERS.forEach((l, i) => {
        const p = pathRefs.current[i];
        if (!p) return;
        let d = `M -20 ${h + 20}`;
        for (let x = -20; x <= w + 20 + STEP; x += STEP) {
          d += ` L ${x} ${waveY(l, x, t, h).toFixed(1)}`;
        }
        p.setAttribute("d", `${d} L ${w + 40} ${h + 20} Z`);
      });

      // Moon/sun path: many thin slices under the light source. Each one is
      // pushed sideways and squeezed by ripples that ride the swell, and the
      // whole column widens and fades with distance from the horizon, the way
      // a real light path breaks up on a rippled surface.
      const top = waveY(LAYERS[0], celX, t, h) + 2;
      const span = h * 0.46;
      for (let i = 0; i < SLICES; i++) {
        const el = sliceRefs.current[i];
        if (!el) continue;
        const d = i / (SLICES - 1);
        const y = top + d * span;
        const ripple =
          Math.sin(y * 0.21 + t * 1.1 + i * 1.7) * 0.5 + Math.sin(y * 0.47 - t * 1.7 + i * 0.6) * 0.5;
        const width = (10 + d * 120) * (0.55 + 0.45 * (ripple * 0.5 + 0.5)) * (0.8 + 0.2 * Math.sin(i * 2.3));
        const dx = ripple * (2 + d * 14) + Math.sin(t * 0.5 + i) * d * 5;
        const alpha = (1 - d * 0.85) * (0.35 + 0.65 * (ripple * 0.5 + 0.5));
        el.setAttribute("x", (celX + dx - width / 2).toFixed(1));
        el.setAttribute("y", y.toFixed(1));
        el.setAttribute("width", width.toFixed(1));
        el.setAttribute("height", (1.6 + d * 2.6).toFixed(1));
        el.setAttribute("opacity", alpha.toFixed(2));
      }

      const r = LAYERS[ROBOT_LAYER];
      const y = waveY(r, robotX, t, h);
      const slope = Math.atan2(waveY(r, robotX + 26, t, h) - waveY(r, robotX - 26, t, h), 52);
      const angle = Math.max(-5, Math.min(5, (slope * 180) / Math.PI * 0.9));
      robotRef.current?.setAttribute(
        "transform",
        `translate(${robotX} ${(y - 10).toFixed(1)}) rotate(${angle.toFixed(2)}) scale(${robotScale})`
      );
    };

    draw(0);
    if (reduced) return;

    // only animate while the sea is actually on screen
    const tick = () => draw(gsap.ticker.time);
    let running = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        gsap.ticker.add(tick);
      } else if (!entry.isIntersecting && running) {
        running = false;
        gsap.ticker.remove(tick);
      }
    });
    io.observe(el);

    return () => {
      io.disconnect();
      if (running) gsap.ticker.remove(tick);
    };
  }, [size, reduced]);

  const { w, h, cx: celX } = size;
  const horizon = h * LAYERS[0].base;

  return (
    <footer className="sea">
      <div className="sea-surface" ref={surfaceRef}>
      <div className="sea-glow" aria-hidden="true" style={{ "--cx": `${celX}px` } as CSSProperties} />

      {w > 0 && (
        <svg className="sea-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <defs>
            <radialGradient id="seaBotHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff5a3c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff5a3c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="seaReflectGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--glint)" stopOpacity="0.3" />
              <stop offset="55%" stopColor="var(--glint)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--glint)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path ref={(el) => { pathRefs.current[0] = el; }} className="sea-layer l1" />
          <path ref={(el) => { pathRefs.current[1] = el; }} className="sea-layer l2" />

          {/* light on the water: a feathered sheen plus the slices driven in draw() */}
          <g className="sea-reflect">
            <ellipse cx={celX} cy={horizon + h * 0.2} rx={110} ry={h * 0.26} fill="url(#seaReflectGlow)" />
            {Array.from({ length: SLICES }, (_, i) => (
              <rect
                key={i}
                ref={(el) => {
                  sliceRefs.current[i] = el;
                }}
                className="glint"
                rx={1.4}
              />
            ))}
          </g>

          <g
            ref={robotRef}
            className="bot"
            data-cursor="big"
            onClick={(e) => {
              const part = (e.target as Element).closest("[data-part]")?.getAttribute("data-part") as BotPart | null;
              poke(part ?? "body");
            }}
          >
            <g ref={bodyGRef} data-part="body">
              <TubeArc d={TUBE_BACK} back />
              <g ref={armLRef}>
                <rect className="bot-arm" x={-44} y={-40} width={18} height={9} rx={4.5} transform="rotate(-20 -44 -36)" />
              </g>
              <g ref={armRRef}>
                <rect className="bot-arm" x={26} y={-40} width={18} height={9} rx={4.5} transform="rotate(20 44 -36)" />
              </g>
              <rect className="bot-body" x={-25} y={-50} width={50} height={84} rx={13} />
              <rect className="bot-panel" x={-13} y={-36} width={26} height={11} rx={4} />
              <g className="bot-dots">
                <circle cx={-6} cy={-30.5} r={1.7} />
                <circle cx={0} cy={-30.5} r={1.7} />
                <circle cx={6} cy={-30.5} r={1.7} />
              </g>
              <TubeArc d={TUBE_FRONT} />
            </g>
            <g ref={headGRef} data-part="face">
              <line className="bot-line" x1={0} y1={-92} x2={0} y2={-112} />
              <g ref={lightGRef} data-part="light">
                <g ref={haloGRef}>
                  <circle className="bot-halo" cx={0} cy={-116} r={20} fill="url(#seaBotHalo)" />
                </g>
                <circle className="bot-light" cx={0} cy={-116} r={5} />
                {/* a bigger invisible target so the little light is easy to click */}
                <circle cx={0} cy={-116} r={13} fill="rgba(0,0,0,0)" />
              </g>
              <rect className="bot-head" x={-29} y={-93} width={58} height={44} rx={17} />
              <rect className="bot-visor" x={-21} y={-84} width={42} height={24} rx={10} />
              <circle className="bot-eye" cx={-8.5} cy={-72} r={3.8} />
              <circle className="bot-eye" cx={8.5} cy={-72} r={3.8} />
              <g transform="translate(-8.5 -72)">
                <path className="bot-spiral" d={SPIRAL} />
                <path className="bot-smile" d="M-4.6 2.2Q0 -4.6 4.6 2.2" />
              </g>
              <g transform="translate(8.5 -72)">
                <path className="bot-spiral" d={SPIRAL} />
                <path className="bot-smile" d="M-4.6 2.2Q0 -4.6 4.6 2.2" />
              </g>
            </g>
          </g>

          <path ref={(el) => { pathRefs.current[2] = el; }} className="sea-layer l3" />
          <path ref={(el) => { pathRefs.current[3] = el; }} className="sea-layer l4" />
        </svg>
      )}

      </div>

      {/* below the surface: the sea keeps going, and the contact content lives down here */}
      <div className="sea-deep" ref={deepRef}>
        <div className="sea-rays" aria-hidden="true" />
        <div className="sea-bubbles" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  left: `${(i * 37 + 11) % 100}%`,
                  width: 3 + (i % 4) * 2,
                  height: 3 + (i % 4) * 2,
                  animationDuration: `${11 + (i % 5) * 3}s`,
                  animationDelay: `${-(i * 1.9)}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* fish silhouettes, and now and then a shark, drifting behind the content */}
        <div className="sea-fish" aria-hidden="true">
          {FISH.flatMap((f, i) =>
            (f.school ? [0, 1, 2] : [0]).map((k) => (
              <div
                key={`${i}-${k}`}
                className={`fish ${f.left ? "to-left" : "to-right"}`}
                style={
                  {
                    top: `${f.y + k * 3.5}%`,
                    "--size": `${f.size * (f.school ? 0.62 : 1) * (1 - k * 0.12)}px`,
                    "--dur": `${f.dur}s`,
                    "--delay": `${f.delay - k * 0.9}s`,
                    // each fish bobs and drifts on its own clock, so none move up and down together
                    "--bdur": `${(3.4 + ((i * 7 + k * 3) % 9) * 0.45).toFixed(2)}s`,
                    "--bdelay": `${-(((i * 5 + k * 2) % 7) * 0.9).toFixed(2)}s`,
                    "--bob": `${4 + ((i * 3 + k) % 4) * 2.5}px`,
                    "--wdur": `${8 + ((i * 11 + k * 4) % 9) * 1.3}s`,
                    "--wdelay": `${-(((i * 13 + k * 5) % 11) * 1.1).toFixed(2)}s`,
                    "--wamp": `${10 + ((i * 5 + k) % 3) * 9}px`,
                  } as CSSProperties
                }
              >
                <svg viewBox="0 0 60 30" className={f.left ? undefined : "flip"}>
                  <use href={f.shape ? "#fish-b" : "#fish-a"} />
                </svg>
              </div>
            ))
          )}
          <div className="fish shark" ref={sharkRef}>
            <svg viewBox="0 0 240 90" ref={sharkSvgRef}>
              <use href="#shark" />
            </svg>
          </div>
          <svg width="0" height="0" className="fish-defs">
            <defs>
              <symbol id="fish-a" viewBox="0 0 60 30">
                <path d="M2 15C12 3 32 3 44 13L58 4L53 15L58 26L44 17C32 27 12 27 2 15Z" />
              </symbol>
              <symbol id="fish-b" viewBox="0 0 60 30">
                <path d="M3 15C10 6 24 4 36 9L40 2L44 10C50 9 55 6 58 3L55 15L58 27C55 24 50 21 44 20L40 28L36 21C24 26 10 24 3 15Z" />
              </symbol>
              <symbol id="shark" viewBox="0 0 240 90">
                <path fillRule="evenodd" d="M4 46C30 34 62 28 96 26L122 4C128 14 132 22 136 27C156 29 168 30 174 32L182 24L188 34C198 35 206 37 214 40L238 8C232 24 228 34 226 46C228 58 232 70 226 82L212 52C190 56 170 58 156 60L160 70L142 61C118 62 104 63 92 63L98 86L66 60C44 58 22 54 4 46ZM20 43a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0Z" />
              </symbol>
            </defs>
          </svg>
        </div>

        {children}

        <div className="sea-credit">
          <span>Roshan Padmanabhan, 2026</span>
          <span>Chennai, India</span>
        </div>
      </div>
    </footer>
  );
}
