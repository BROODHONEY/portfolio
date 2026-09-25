"use client";

import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "hero", file: "index.tsx" },
  { id: "about", file: "about.md" },
  { id: "projects", file: "works.tsx" },
  { id: "connect", file: "connect.ts" },
];

/**
 * A code-editor status line down the left edge: branch, the file for the
 * section you are in, and a line and column that follow the scroll. Purely a
 * nod to where this page comes from.
 */
export default function EditorGutter() {
  const [state, setState] = useState({ file: "index.tsx", ln: 1, col: 1, sea: false });
  const raf = useRef(0);

  useEffect(() => {
    const update = () => {
      raf.current = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      let current = SECTIONS[0];
      SECTIONS.forEach((s) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const top = s.id === "hero" ? 0 : (el.closest(".pin-spacer") ?? el).getBoundingClientRect().top + y;
        if (y + vh * 0.5 >= top) current = s;
      });
      setState({
        file: current.file,
        ln: 1 + Math.round((y / max) * 286),
        col: 1 + (Math.round(y) % 72),
        sea: current.id === "connect",
      });
    };
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div className={`gutter mono${state.sea ? " on-sea" : ""}`} aria-hidden="true">
      <span>git:main</span>
      <span>{state.file}</span>
      <span>
        Ln {state.ln}, Col {state.col}
      </span>
      <span>TypeScript</span>
    </div>
  );
}
