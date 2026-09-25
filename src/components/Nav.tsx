"use client";

import type { MouseEvent } from "react";
import { scrollToSection } from "@/lib/useSmoothScroll";

const links = [
  { id: "about", label: "About" },
  { id: "projects", label: "Works" },
  { id: "connect", label: "Connect" },
];

export default function Nav() {
  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToSection(id, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };

  return (
    <nav className="nav">
      <a className="mark" href="#hero" onClick={go("hero")}>
        Roshan Padmanabhan
      </a>
      <div className="menu">
        {links.map((l) => (
          <a key={l.id} href={`#${l.id}`} onClick={go(l.id)}>
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
