"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type CursorMode = "default" | "big" | "label";

export default function CursorDot() {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const el = ref.current;
    if (!el || reduced || touch) {
      if (el) el.style.display = "none";
      return;
    }

    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const setX = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const setY = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });

    function onMove(e: MouseEvent) {
      setX(e.clientX);
      setY(e.clientY);
    }
    window.addEventListener("mousemove", onMove);

    let mode: CursorMode = "default";
    const applyMode = (next: CursorMode, label: string, accent: string) => {
      if (mode !== next) {
        el!.classList.toggle("big", next === "big");
        el!.classList.toggle("label", next === "label");
        mode = next;
      }
      el!.style.setProperty("--cursor-accent", accent || "var(--accent)");
      if (labelRef.current) labelRef.current.textContent = label;
    };

    function onOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>("[data-cursor]");
      if (target) {
        const kind = target.dataset.cursor;
        const accent = target.dataset.cursorAccent ?? "";
        if (kind === "view") applyMode("label", "VIEW", accent);
        else if (kind === "open") applyMode("label", "OPEN", accent);
        else if (kind === "external") applyMode("label", "↗", accent);
        else applyMode("big", "", accent);
        return;
      }
      if ((e.target as HTMLElement)?.closest("a, button")) {
        applyMode("big", "", "");
      }
    }

    function onOut(e: MouseEvent) {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest("[data-cursor], a, button")) return;
      applyMode("default", "", "");
    }

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <div ref={ref} id="cdot" aria-hidden="true">
      <span className="cdot-label" ref={labelRef} />
    </div>
  );
}
