"use client";

import { useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

/**
 * Smooth-scrolls to a section by id. "hero" always goes to the very top:
 * the hero is pinned, so the browser's own #hero anchor jump lands on
 * wherever the pinned element currently sits and never fully resets.
 */
export function scrollToSection(id: string, reduced = false) {
  const el = document.getElementById(id);
  const top = id === "hero" ? 0 : el;
  if (top === null || top === undefined) return;
  if (lenisInstance && !reduced) {
    const targetY = typeof top === "number" ? top : top.getBoundingClientRect().top + window.scrollY;
    // longer trips take longer, so the travel always reads as an animation
    const distance = Math.abs(targetY - window.scrollY);
    const duration = Math.min(2.4, Math.max(0.9, distance / 2200 + 0.6));
    lenisInstance.scrollTo(targetY, {
      duration,
      easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      lock: true,
    });
  } else if (typeof top === "number") {
    window.scrollTo({ top: 0 });
  } else {
    top.scrollIntoView();
  }
}

/**
 * Wires Lenis smooth scrolling into GSAP's ticker and keeps ScrollTrigger
 * in sync with it. Mount once, near the root of the page.
 * Respects prefers-reduced-motion: skips Lenis entirely so native
 * (instant) scrolling is used instead.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
    lenisInstance = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
    };
  }, []);
}
