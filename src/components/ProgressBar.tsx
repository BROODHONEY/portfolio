"use client";

import { useEffect, useRef } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        el.style.width = self.progress * 100 + "%";
      },
    });
    return () => st.kill();
  }, []);

  return <div ref={ref} id="progress" />;
}
