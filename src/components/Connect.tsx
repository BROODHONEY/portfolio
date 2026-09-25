"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Connect() {
  const sectionRef = useRef<HTMLElement>(null);
  const mailRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(".connect-title-inner, .connect-fade", { opacity: 1, y: 0 });
        gsap.set(".connect-title-inner", { y: "0%" });
        return;
      }

      // The content slides down from above as the page scrolls it into view (scrubbed,
      // so it moves with the wheel), and settles into place. Each piece a little later
      // than the one before.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top 88%", end: "top 4%", scrub: 1 },
      });
      tl.fromTo(".invite", { y: -130, opacity: 0 }, { y: 0, opacity: 1, ease: "power3.out", duration: 1 }, 0);
      gsap.utils.toArray<HTMLElement>(".connect-title-inner").forEach((el, i) => {
        // y is zeroed too: the CSS starting transform (translateY(100%)) is read by GSAP as pixels
        tl.fromTo(el, { y: 0, yPercent: -125 }, { y: 0, yPercent: 0, ease: "power3.out", duration: 1 }, 0.12 + i * 0.12);
      });
      tl.fromTo(".connect-meta", { y: -110, opacity: 0 }, { y: 0, opacity: 1, ease: "power3.out", duration: 1 }, 0.3);
      tl.fromTo(".mail-line", { y: -110, opacity: 0 }, { y: 0, opacity: 1, ease: "power3.out", duration: 1 }, 0.4);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = mailRef.current;
    if (!el || reduced) return;

    let bounds: DOMRect | null = null;
    const onEnter = () => (bounds = el.getBoundingClientRect());
    const onMove = (e: MouseEvent) => {
      if (!bounds) return;
      gsap.to(el, {
        x: (e.clientX - (bounds.left + bounds.width / 2)) * 0.2,
        y: (e.clientY - (bounds.top + bounds.height / 2)) * 0.2,
        duration: 0.4,
        ease: "power2.out",
      });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section id="connect" ref={sectionRef}>
      <div className="col-grid">
        <div className="invite mono connect-fade">Say hello</div>
        <h2 className="close-title">
          <span className="reveal-line">
            <span className="inner-up connect-title-inner">Let&rsquo;s build</span>
          </span>
          <span className="reveal-line">
            <span className="inner-up connect-title-inner accent-word">something.</span>
          </span>
        </h2>
        <div className="connect-meta connect-fade">
          <a href="#" data-cursor="external">
            <span className="link-text">GitHub</span>
            <span className="link-arrow">↗</span>
          </a>
          <a href="#" data-cursor="external">
            <span className="link-text">LinkedIn</span>
            <span className="link-arrow">↗</span>
          </a>
          <a href="#" data-cursor="external">
            <span className="link-text">Resume</span>
            <span className="link-arrow">↗</span>
          </a>
        </div>
        <div className="mail-line connect-fade">
          <a href="mailto:rproshan11@gmail.com" ref={mailRef} data-cursor="open">
            <span className="magnet">rproshan11@gmail.com</span>
          </a>
        </div>
      </div>
    </section>
  );
}
