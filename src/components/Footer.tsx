"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Layer = { base: number; amp: number; wl: number; speed: number; dir: 1 | -1; phase: number };

// back to front. `base` is a fraction of the footer's height, so the sea
// scales with the viewport; the robot rides layer index ROBOT_LAYER.
const LAYERS: Layer[] = [
  { base: 0.36, amp: 2, wl: 620, speed: 0.16, dir: 1, phase: 0 },
  { base: 0.46, amp: 4, wl: 520, speed: 0.22, dir: -1, phase: 1.7 },
  { base: 0.6, amp: 6.5, wl: 440, speed: 0.28, dir: 1, phase: 3.1 },
  { base: 0.76, amp: 9, wl: 380, speed: 0.34, dir: -1, phase: 4.6 },
];
const ROBOT_LAYER = 2;
const STEP = 14;
const SLICES = 46;

// a long, slow swell plus a smaller cross-swell running the other way: calm,
// but never a single repeating sine
function waveY(l: Layer, x: number, t: number, h: number) {
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

          <g ref={robotRef} className="bot">
            <circle className="bot-halo" cx={0} cy={-116} r={20} fill="url(#seaBotHalo)" />
            <line className="bot-line" x1={0} y1={-92} x2={0} y2={-112} />
            <circle className="bot-light" cx={0} cy={-116} r={5} />
            <rect className="bot-arm" x={-44} y={-40} width={18} height={9} rx={4.5} transform="rotate(-20 -44 -36)" />
            <rect className="bot-arm" x={26} y={-40} width={18} height={9} rx={4.5} transform="rotate(20 44 -36)" />
            <rect className="bot-body" x={-25} y={-50} width={50} height={84} rx={13} />
            <rect className="bot-panel" x={-13} y={-36} width={26} height={11} rx={4} />
            <g className="bot-dots">
              <circle cx={-6} cy={-30.5} r={1.7} />
              <circle cx={0} cy={-30.5} r={1.7} />
              <circle cx={6} cy={-30.5} r={1.7} />
            </g>
            <rect className="bot-head" x={-29} y={-93} width={58} height={44} rx={17} />
            <rect className="bot-visor" x={-21} y={-84} width={42} height={24} rx={10} />
            <circle className="bot-eye" cx={-8.5} cy={-72} r={3.8} />
            <circle className="bot-eye" cx={8.5} cy={-72} r={3.8} />
          </g>

          <path ref={(el) => { pathRefs.current[2] = el; }} className="sea-layer l3" />
          <path ref={(el) => { pathRefs.current[3] = el; }} className="sea-layer l4" />
        </svg>
      )}

      </div>

      {/* below the surface: the sea keeps going, and the contact content lives down here */}
      <div className="sea-deep">
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

        {children}

        <div className="sea-credit">
          <span>Roshan Padmanabhan, 2026</span>
          <span>Chennai, India</span>
        </div>
      </div>
    </footer>
  );
}
