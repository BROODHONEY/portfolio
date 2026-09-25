"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const wmFirst = useRef<HTMLSpanElement>(null);
  const wmSecond = useRef<HTMLSpanElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const scrollMarkRef = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const heroEl = heroRef.current;
    let onMove: ((e: MouseEvent) => void) | null = null;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([wmFirst.current, wmSecond.current], { y: "0%" });
        gsap.set([rolesRef.current, quoteRef.current, scrollMarkRef.current], { opacity: 1 });
        return;
      }

      gsap
        .timeline({ delay: 0.1 })
        .to(wmFirst.current, { y: "0%", duration: 0.95, ease: "power4.out" })
        .to(wmSecond.current, { y: "0%", duration: 0.95, ease: "power4.out" }, "-=0.7")
        .to(rolesRef.current, { opacity: 1, duration: 0.7 }, "-=0.4")
        .to(quoteRef.current, { opacity: 1, duration: 0.7 }, "-=0.5")
        .to(scrollMarkRef.current, { opacity: 1, duration: 0.6 }, "-=0.3");

      // primary motion: the wordmark diverges apart as you commit to scrolling,
      // pinned so the opening statement holds before releasing into About
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: "+=60%",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(wmFirst.current, { x: -p * 140, opacity: 1 - p * 1.2 });
          gsap.set(wmSecond.current, { x: p * 140, opacity: 1 - p * 1.2 });
          gsap.set(row2Ref.current, { opacity: 1 - p * 1.6, y: p * 20 });
          gsap.set(scrollMarkRef.current, { opacity: Math.max(0, 1 - p * 3) });
          quoteRef.current?.style.setProperty(
            "--tagline-accent",
            gsap.utils.interpolate("#ff4d23", "#8b5cf6", p)
          );
        },
      });

      // subtle pointer parallax on the wordmark as a whole — physical, not scroll
      if (!coarse) {
        const setPX = gsap.quickTo(wordmarkRef.current, "x", { duration: 0.6, ease: "power3.out" });
        const setPY = gsap.quickTo(wordmarkRef.current, "y", { duration: 0.6, ease: "power3.out" });
        onMove = (e: MouseEvent) => {
          const w = window.innerWidth / 2;
          const h = window.innerHeight / 2;
          setPX(((e.clientX - w) / w) * 10);
          setPY(((e.clientY - h) / h) * 8);
        };
        heroEl?.addEventListener("mousemove", onMove);
      }
    }, heroRef);

    return () => {
      if (onMove) heroEl?.removeEventListener("mousemove", onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section id="hero" ref={heroRef}>
      <div className="col-grid">
        <div className="hero-wordmark" ref={wordmarkRef}>
          <div className="wm-line">
            <span className="inner" ref={wmFirst}>
              ROSHAN
            </span>
          </div>
          <div className="wm-line">
            <span className="inner" ref={wmSecond}>
              PADMANABHAN
            </span>
          </div>
        </div>
        <div className="hero-row2" ref={row2Ref}>
          <div className="hero-roles" ref={rolesRef}>
            <span>AI Engineer</span>
            <span>/</span>
            <span>Software Engineer</span>
            <span>/</span>
            <span>Web Developer</span>
          </div>
          <div className="hero-quote" ref={quoteRef}>
            I build systems that make <span>machines act</span>.
          </div>
        </div>
      </div>
      <div className="scroll-mark" ref={scrollMarkRef}>
        <div className="stem" />
        Scroll
      </div>
    </section>
  );
}
