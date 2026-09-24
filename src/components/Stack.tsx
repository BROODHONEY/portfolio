"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { skills } from "@/lib/data";

export default function Stack() {
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = cardRefs.current.filter((c): c is HTMLDivElement => !!c);
    const deckEl = deckRef.current;

    if (reduced) {
      cards.forEach((c) => (c.style.opacity = "1"));
      return;
    }

    // fan-in on scroll: cards start stacked flat, then splay to their
    // resting position, staggered
    cards.forEach((c) => {
      c.style.setProperty("--x", "0px");
      c.style.setProperty("--y", "0px");
      c.style.setProperty("--r", "0deg");
      c.style.opacity = "0";
    });

    const st = ScrollTrigger.create({
      trigger: deckEl,
      start: "top 80%",
      once: true,
      onEnter: () => {
        cards.forEach((c, i) => {
          const skill = skills[i];
          gsap.to(c, {
            "--x": `${skill.x}px`,
            "--y": `${skill.y}px`,
            "--r": `${skill.r}deg`,
            opacity: 1,
            duration: 0.7,
            delay: i * 0.05,
            ease: "power3.out",
          });
        });
      },
    });

    // the deck as a whole drifts slightly with the pointer — a physical
    // object being tilted, not individual cards fighting their own hover CSS
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let onMove: ((e: MouseEvent) => void) | null = null;
    if (!coarse && deckEl) {
      const setX = gsap.quickTo(deckEl, "x", { duration: 0.7, ease: "power3.out" });
      const setY = gsap.quickTo(deckEl, "y", { duration: 0.7, ease: "power3.out" });
      onMove = (e: MouseEvent) => {
        const rect = deckEl.getBoundingClientRect();
        const px = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        const py = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        setX(px * 14);
        setY(py * 8);
      };
      deckEl.addEventListener("mousemove", onMove);
    }

    return () => {
      st.kill();
      if (onMove) deckEl?.removeEventListener("mousemove", onMove);
    };
  }, []);

  const active = hovered !== null ? skills[hovered] : null;

  return (
    <section id="stack">
      <div className="col-grid">
        <div className="section-label">
          Stack
        </div>

        <div className="deck-wrap" ref={deckRef}>
          {skills.map((skill, i) => (
            <div
              key={skill.name}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="spec"
              style={
                {
                  "--x": `${skill.x}px`,
                  "--y": `${skill.y}px`,
                  "--r": `${skill.r}deg`,
                } as CSSProperties
              }
              tabIndex={0}
              role="button"
              aria-label={`${skill.name}: ${skill.use}`}
              onMouseEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              onClick={() => setHovered(i)}
            >
              <span className="cat">{skill.category}</span>
              <h3>{skill.name}</h3>
            </div>
          ))}
        </div>

        <div className="detail-panel">
          {!active ? (
            <div className="ph mono">Hover a card</div>
          ) : (
            <>
              <div className="ph mono active-cat">{active.category}</div>
              <h3>{active.name}</h3>
              <p>{active.use}</p>
              <div className="used mono">
                Used in <span>{active.project}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
