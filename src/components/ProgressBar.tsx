"use client";

import { useEffect, useRef } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    // measured from the real document height (pin spacers included) on every
    // frame, so it stays correct after ScrollTrigger refreshes the layout
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.width = p * 100 + "%";
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

  return <div ref={ref} id="progress" />;
}
