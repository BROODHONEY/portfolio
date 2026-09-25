"use client";

import { useEffect, useRef, useState } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { scrollToSection } from "@/lib/useSmoothScroll";

const targets = [
  { id: "hero", label: "Top" },
  { id: "about", label: "About" },
  { id: "projects", label: "Works" },
  { id: "connect", label: "Connect" },
];

/**
 * Right-edge scroll indicator: one line per section. Each line fills up
 * (top to bottom) as you scroll through its section, then the next one
 * starts filling. Hover a line for its name; click to jump there.
 */
export default function JumpIndex() {
  const [active, setActive] = useState("hero");
  const reducedRef = useRef(false);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let lastActive = "hero";

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - vh;
      let current = targets[0].id;

      // Pinned sections (hero, about) are wrapped in a stationary pin-spacer;
      // measure that, since the pinned element itself moves while pinned.
      const starts = targets.map((t) => {
        const el = document.getElementById(t.id);
        if (!el) return 0;
        if (t.id === "hero") return 0;
        const box = el.closest(".pin-spacer") ?? el;
        return box.getBoundingClientRect().top + y;
      });

      // each line spans from its section's start to the next one's, and the
      // last one runs to the bottom of the page, so the lines together track
      // the same scroll position as the top progress bar
      targets.forEach((t, i) => {
        const fill = fillRefs.current[i];
        if (!fill) return;
        const start = starts[i];
        const end = i < targets.length - 1 ? starts[i + 1] : max;
        const p = end > start ? Math.min(1, Math.max(0, (y - start) / (end - start))) : y >= start ? 1 : 0;
        fill.style.transform = `scaleY(${p})`;
        if (y + vh * 0.5 >= start) current = t.id;
      });

      if (current !== lastActive) {
        lastActive = current;
        setActive(current);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    ScrollTrigger.addEventListener("refresh", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ScrollTrigger.removeEventListener("refresh", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="jump">
      {targets.map((t, i) => (
        <button
          key={t.id}
          className={active === t.id ? "active" : ""}
          aria-label={t.label}
          onClick={() => scrollToSection(t.id, reducedRef.current)}
        >
          <span className="txt">{t.label}</span>
          <span className="bar" aria-hidden="true">
            <span
              className="fill"
              ref={(el) => {
                fillRefs.current[i] = el;
              }}
            />
          </span>
        </button>
      ))}
    </div>
  );
}
