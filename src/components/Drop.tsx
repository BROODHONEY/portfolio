"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { LAYERS, waveY } from "@/components/Footer";
import { WORKS_PIN_ID } from "@/components/Projects";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// teardrop with its point at the origin, ~18 wide and ~27 tall
const DROP_H = 27;
const DROP_PATH = "M0 0C5 8 9 13 9 18A9 9 0 0 1 -9 18C-9 13 -5 8 0 0Z";
const STRETCH = 1.4; // how long the drop is once it lets go
const BITS = 9;
const CLIP_HALF = 190; // half-width of the water the rings are allowed to spread over

// The fall is tied to the scroll. The drop lets go once the leaf tip has risen to
// TIP_LETGO (fraction of the viewport height) and lands when the water's surface
// reaches FALL_END, so it drops a long way, through the words in between.
const TIP_LETGO = 0.36;
const FALL_END = 0.82;
// words start to appear this many px before the drop reaches them
const REVEAL_LEAD = 90;

/**
 * The drop from the leaf under the works canvas. It swells on the leaf's tip
 * while the works section finishes pinning, then falls as you scroll: its
 * position is a direct function of the scroll position, so it speeds up as the
 * water rises to meet it, and rewinds if you scroll back. It goes into the
 * first band of water in the footer, where a small splash spreads across the
 * surface (the rings are clipped to the water, never floating above it).
 * A fixed layer above the page; the leaf tip and the sea are found by
 * measuring them, so it lines up at any viewport size.
 */
export default function Drop() {
  const reduced = useReducedMotion();
  const dropRef = useRef<SVGGElement>(null);
  const splashRef = useRef<SVGGElement>(null);
  const ringsRef = useRef<SVGGElement>(null);
  const bitsRef = useRef<SVGGElement>(null);
  const jetRef = useRef<SVGEllipseElement>(null);
  const ringRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const bitRefs = useRef<(SVGCircleElement | null)[]>([]);
  const aboveClipRef = useRef<SVGRectElement>(null);
  const waterClipRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const drop = dropRef.current;
    const splash = splashRef.current;
    const ringsG = ringsRef.current;
    const bitsG = bitsRef.current;
    const jet = jetRef.current;
    const aboveClip = aboveClipRef.current;
    const waterClip = waterClipRef.current;
    const rings = ringRefs.current.filter((r): r is SVGEllipseElement => !!r);
    const bits = bitRefs.current.filter((b): b is SVGCircleElement => !!b);
    const dripLines = Array.from(document.querySelectorAll<HTMLElement>(".drip-line")).map((line) => ({
      line,
      words: Array.from(line.querySelectorAll<HTMLElement>(".drip-word")),
    }));
    if (reduced || !drop || !splash || !ringsG || !bitsG || !jet || !aboveClip || !waterClip) return;

    let landed = false;
    let splashing = false;

    const splashTl = gsap.timeline({
      paused: true,
      onComplete: () => {
        splashing = false;
        gsap.set(splash, { autoAlpha: 0 });
      },
    });
    // a little column of water pops up where the drop went in…
    splashTl
      .fromTo(jet, { attr: { rx: 6, ry: 0, cy: 0 }, opacity: 1 }, { attr: { rx: 4.5, ry: 24, cy: -16 }, duration: 0.14, ease: "power2.out" }, 0)
      .to(jet, { attr: { rx: 2, ry: 0, cy: 0 }, opacity: 0, duration: 0.26, ease: "power2.in" }, 0.14);
    // …rings spread across the water…
    rings.forEach((ring, i) => {
      const reach = [62, 100, 140][i] ?? 120;
      splashTl.fromTo(
        ring,
        { attr: { rx: 6, ry: 1.4 }, opacity: 0.95, strokeWidth: 3 },
        { attr: { rx: reach, ry: reach * 0.2 }, opacity: 0, strokeWidth: 0.6, duration: 1.1 + i * 0.2, ease: "power2.out" },
        i * 0.12
      );
    });
    // …and a few beads of water arc out and fall back
    bits.forEach((bit, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const spread = 16 + ((i * 37) % 52);
      const peak = 30 + ((i * 53) % 40);
      const flight = 0.5 + ((i * 29) % 20) / 100;
      splashTl
        .fromTo(bit, { x: 0, y: 0, opacity: 1 }, { x: side * spread, duration: flight, ease: "none" }, 0.02)
        .fromTo(bit, { y: 0 }, { y: -peak, duration: flight * 0.45, ease: "power2.out" }, 0.02)
        .to(bit, { y: 0, duration: flight * 0.55, ease: "power2.in" }, 0.02 + flight * 0.45)
        .to(bit, { opacity: 0, duration: 0.12 }, 0.02 + flight - 0.08);
    });

    const stopSplash = () => {
      splashTl.pause(0);
      splashing = false;
      gsap.set(splash, { autoAlpha: 0 });
    };

    // words appear as the drop passes them, one after another; scroll back and they un-write
    const reveal = (dropBottom: number) => {
      dripLines.forEach(({ line, words }) => {
        const top = line.getBoundingClientRect().top;
        words.forEach((w, k) => {
          const o = clamp01((dropBottom + REVEAL_LEAD - (top + k * 30)) / 40);
          w.style.opacity = o.toFixed(3);
          w.style.transform = `translateY(${((1 - o) * 18).toFixed(1)}px)`;
        });
      });
    };

    const tick = () => {
      const st = ScrollTrigger.getById(WORKS_PIN_ID);
      const tip = document.querySelector("[data-leaf-tip]");
      const sea = document.querySelector(".sea-surface");
      if (!st || !tip || !sea) {
        gsap.set(drop, { autoAlpha: 0 });
        return;
      }

      const vh = window.innerHeight;
      const scroll = window.scrollY;
      const t = gsap.ticker.time;
      const seaRect = sea.getBoundingClientRect();
      const x = document.documentElement.clientWidth / 2;

      // the first band of water: between the far wave's crest and the next one's
      const crest0 = seaRect.top + waveY(LAYERS[0], x, t, seaRect.height);
      const waterView = crest0 + 14; // where the drop's ripples are centred

      // scroll drives the fall: 0 while it hangs, 1 when it has gone in
      const r0 = tip.getBoundingClientRect();
      const tipMid = r0.top + r0.height / 2;
      // scroll travelled since letting go, against scroll still to go before it lands
      const elapsed = Math.max(0, vh * TIP_LETGO - tipMid);
      const remaining = Math.max(0, waterView - vh * FALL_END);
      const fallP = elapsed + remaining > 0 && elapsed > 0 ? elapsed / (elapsed + remaining) : 0;
      const pinP = clamp01((scroll - st.start) / (st.end - st.start));
      const swell = clamp01((pinP - 0.68) / 0.28);

      // everything below the wave's crest is hidden from the drop, so it goes *into* the water
      aboveClip.setAttribute("x", (x - 60).toFixed(1));
      aboveClip.setAttribute("y", "-400");
      aboveClip.setAttribute("width", "120");
      aboveClip.setAttribute("height", (crest0 + 400).toFixed(1));

      if (splashing) {
        const tf = `translate(${x.toFixed(1)} ${waterView.toFixed(1)})`;
        ringsG.setAttribute("transform", tf);
        bitsG.setAttribute("transform", tf);
        // rings only exist on the water: clip them between two swells
        let d = "";
        const step = 12;
        for (let px = x - CLIP_HALF; px <= x + CLIP_HALF; px += step) {
          d += `${d ? "L" : "M"}${px.toFixed(0)} ${(seaRect.top + waveY(LAYERS[0], px, t, seaRect.height) - 1).toFixed(1)}`;
        }
        for (let px = x + CLIP_HALF; px >= x - CLIP_HALF; px -= step) {
          d += `L${px.toFixed(0)} ${(seaRect.top + waveY(LAYERS[1], px, t, seaRect.height)).toFixed(1)}`;
        }
        waterClip.setAttribute("d", `${d}Z`);
      }

      // scrolled back up: the drop is on its leaf again
      if (fallP < 1 && landed) {
        landed = false;
        stopSplash();
      }

      if (fallP >= 1) {
        gsap.set(drop, { autoAlpha: 0 });
        reveal(Infinity);
        if (!landed) {
          landed = true;
          splashing = true;
          gsap.set(splash, { autoAlpha: 1 });
          splashTl.restart();
        }
        return;
      }

      const r = tip.getBoundingClientRect();
      const tipX = r.left + r.width / 2;
      const tipY = r.top + r.height / 2;
      const visible = swell > 0 && tipY > -60 && tipY < vh + 20;
      if (!visible && fallP === 0) {
        gsap.set(drop, { autoAlpha: 0 });
        reveal(-Infinity);
        return;
      }

      // heavier and longer as the water rises to meet it, then it lets go
      const approach = clamp01((vh * 0.9 - tipMid) / (vh * (0.9 - TIP_LETGO)));
      const size = 0.3 + 0.7 * swell;
      const sy = fallP > 0 ? STRETCH : size * (1 + (STRETCH - 1) * approach);
      const sx = fallP > 0 ? 1 - 0.08 * fallP : size;

      // gravity: it starts on the leaf and speeds up towards the water
      const e = fallP * fallP;
      const H = DROP_H * STRETCH;
      const dx = tipX + (x - tipX) * e;
      const dy = tipY + (waterView - 6 - H - tipY) * e;
      gsap.set(drop, { autoAlpha: 1 });
      reveal(fallP > 0 ? dy + H : -Infinity);
      drop.setAttribute("transform", `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      splashTl.kill();
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <svg className="drop-layer" aria-hidden="true">
      <defs>
        <clipPath id="dropAboveWater">
          <rect ref={aboveClipRef} />
        </clipPath>
        <clipPath id="dropInWater">
          <path ref={waterClipRef} />
        </clipPath>
      </defs>

      <g clipPath="url(#dropAboveWater)">
        <g ref={dropRef} style={{ opacity: 0, visibility: "hidden" }}>
          <path className="drop-body" d={DROP_PATH} />
          <ellipse className="drop-shine" cx={-3.2} cy={18} rx={1.7} ry={3.4} />
        </g>
      </g>

      <g ref={splashRef} style={{ opacity: 0, visibility: "hidden" }}>
        <g clipPath="url(#dropInWater)">
          <g ref={ringsRef}>
            {[0, 1, 2].map((i) => (
              <ellipse
                key={i}
                ref={(el) => {
                  ringRefs.current[i] = el;
                }}
                className="splash-ring"
                cx={0}
                cy={0}
                rx={6}
                ry={1.4}
                opacity={0}
              />
            ))}
          </g>
        </g>
        <g ref={bitsRef}>
          <ellipse ref={jetRef} className="drop-body" cx={0} cy={0} rx={6} ry={0} opacity={0} />
          {Array.from({ length: BITS }, (_, i) => (
            <circle
              key={i}
              ref={(el) => {
                bitRefs.current[i] = el;
              }}
              className="splash-bit"
              cx={0}
              cy={0}
              r={2 + (i % 3)}
              opacity={0}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
