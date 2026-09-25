"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { registerPageTransition } from "@/lib/useSmoothScroll";

// What the sheet says while it covers the page: a few options per section, one picked at random
const LINES: Record<string, string[]> = {
  hero: ["Back to the top we go.", "Rewinding the tape…"],
  about: ["Interested in knowing me?", "Curious who’s behind the code?", "Pull up a chair. Story time."],
  projects: ["Ready to see what I’ve been building?", "Fresh off the workbench.", "Warning: contains robots."],
  connect: ["Don’t be shy, say hi.", "Let’s talk. I bite less than the shark.", "Go on, slide into my inbox."],
};

/**
 * Nav clicks (top bar and side index) don't glide through the page: a
 * round-edged sheet the size of the whole page slides in from the right and
 * covers it, the page jumps to the section underneath, and the sheet then
 * leaves to the left. The sheet uses the same paper as the works canvas, so it
 * follows the theme.
 */
export default function PageTransition() {
  const panelRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const panel = panelRef.current;
    const label = labelRef.current;
    if (!panel || !label) return;

    registerPageTransition((id, jump) => {
      if (busyRef.current) return;
      busyRef.current = true;
      const options = LINES[id] ?? [""];
      label.textContent = options[Math.floor(Math.random() * options.length)];

      // the sheet is 150vw wide: at rest (covering) it reaches 25vw past both edges,
      // so its rounded corners are never on screen while it covers the page
      gsap
        .timeline({
          onComplete: () => {
            gsap.set(panel, { autoAlpha: 0 });
            busyRef.current = false;
          },
        })
        .set(panel, { x: "100vw", autoAlpha: 1 })
        .to(panel, { x: "-25vw", duration: 0.85, ease: "power3.inOut" })
        .fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.inOut" }, "-=0.4")
        .call(jump)
        // hold for a moment so the line can be read before the sheet leaves
        .to(label, { opacity: 0, duration: 0.35, ease: "power1.inOut" }, "+=1.1")
        .to(panel, { x: "-150vw", duration: 0.9, ease: "power3.inOut" }, "-=0.1");
    });

    return () => registerPageTransition(null);
  }, []);

  return (
    <div className="page-sheet" ref={panelRef} aria-hidden="true">
      <div className="page-sheet-label" ref={labelRef} />
    </div>
  );
}
