"use client";

import { useEffect, useRef, useState } from "react";
import { scrollToSection } from "@/lib/useSmoothScroll";

const targets = [
  { id: "hero", label: "Top" },
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "projects", label: "Projects" },
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
      // a section counts as "in progress" once its top passes the screen's midpoint
      const probe = window.scrollY + vh * 0.5;
      let current = targets[0].id;

      targets.forEach((t, i) => {
        const el = document.getElementById(t.id);
        const fill = fillRefs.current[i];
        if (!el || !fill) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const p = Math.min(1, Math.max(0, (probe - top) / el.offsetHeight));
        fill.style.transform = `scaleY(${p})`;
        if (probe >= top) current = t.id;
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
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
