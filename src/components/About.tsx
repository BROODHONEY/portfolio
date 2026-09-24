"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { timelineStages } from "@/lib/data";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

function renderTitle(title: string, keyword: string, accent: string) {
  const idx = title.indexOf(keyword);
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <span className="kw" style={{ "--kw-accent": accent } as CSSProperties}>
        {keyword}
      </span>
      {title.slice(idx + keyword.length)}
    </>
  );
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const offsetsRef = useRef({ hold: 0, shrink: 0, step: 0 });
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  // The whole section is one full-viewport panel that pins to the screen.
  // Page scroll (not a nested scroll box) drives everything inside it:
  //   1. "About me" holds big and centered,
  //   2. it shrinks to a top-left subheading,
  //   3. each stage takes over in turn.
  // The pin only releases once the last stage has played, so the rest of
  // the page waits until this section is finished.
  useEffect(() => {
    const pin = pinRef.current;
    const title = titleRef.current;
    const content = contentRef.current;
    const stages = stageRefs.current.filter((s): s is HTMLDivElement => !!s);
    if (!pin || !title || !content || stages.length === 0) return;

    if (reduced) return;

    const n = stages.length;
    let scaleTarget = 1;
    let targetX = 0;
    let targetY = 0;
    let lastActive = 0;

    const measure = () => {
      const vw = window.innerWidth;
      const vh = pin.clientHeight;
      const gutter = Math.min(56, Math.max(20, vw * 0.04));

      gsap.set(title, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
      const bigFontSize = parseFloat(getComputedStyle(title).fontSize);
      scaleTarget = 40 / bigFontSize;
      // offsetWidth/Height ignore transforms, so this is the unscaled box
      const w = title.offsetWidth * scaleTarget;
      const h = title.offsetHeight * scaleTarget;
      targetX = gutter + w / 2 - vw / 2;
      targetY = 96 + h / 2 - vh / 2;

      offsetsRef.current = { hold: vh * 0.2, shrink: vh * 0.9, step: vh * 0.7 };
    };

    const ease = gsap.parseEase("power3.inOut");
    // the title/stages chase the real scroll position instead of jumping
    // to it, so the shrink glides even when the wheel moves in big steps
    let target = 0;
    let current = 0;
    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.05) {
        if (diff !== 0) {
          current = target;
          render(current);
        }
        return;
      }
      current += diff * 0.1;
      render(current);
    };

    const render = (scrolled: number) => {
      const { hold, shrink, step } = offsetsRef.current;
      const shrinkP = ease(clamp01((scrolled - hold) / shrink));
      const stageP = clamp01((scrolled - hold - shrink) / (step * (n - 1))) * (n - 1);

      gsap.set(title, {
        scale: gsap.utils.interpolate(1, scaleTarget, shrinkP),
        x: gsap.utils.interpolate(0, targetX, shrinkP),
        y: gsap.utils.interpolate(0, targetY, shrinkP),
        color: gsap.utils.interpolate("#0a0a0a", "#6b6b6b", shrinkP),
      });

      // rail fades in as the title settles
      gsap.set(content, { opacity: clamp01((shrinkP - 0.5) * 2) });

      stages.forEach((el, i) => {
        const d = i - stageP;
        gsap.set(el, {
          opacity: clamp01(1 - Math.abs(d) * 1.6),
          y: d * 70,
        });
      });

      railRef.current?.style.setProperty("--rp", String(n > 1 ? stageP / (n - 1) : 0));

      const idx = Math.round(stageP);
      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
      }
    };

    const ctx = gsap.context(() => {
      measure();
      triggerRef.current = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () => {
          measure();
          const { hold, shrink, step } = offsetsRef.current;
          // a short dwell on the final stage before the page moves on
          return `+=${hold + shrink + step * (n - 1) + step * 0.5}`;
        },
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          target = current = self.scroll() - self.start;
          render(current);
        },
        onUpdate: (self) => {
          target = self.scroll() - self.start;
        },
      });
      render(0);
      gsap.ticker.add(tick);
    }, sectionRef);

    return () => {
      gsap.ticker.remove(tick);
      triggerRef.current = null;
      ctx.revert();
    };
  }, [reduced]);

  const goTo = (i: number) => {
    const st = triggerRef.current;
    if (!st) {
      stageRefs.current[i]?.scrollIntoView({ block: "center" });
      return;
    }
    const { hold, shrink, step } = offsetsRef.current;
    window.scrollTo({ top: st.start + hold + shrink + step * i });
  };

  return (
    <section id="about" ref={sectionRef} className={reduced ? "reduced" : undefined}>
      <div className="about-pin" ref={pinRef}>
        <h2 className="about-title" ref={titleRef}>
          About me
        </h2>

        <div className="col-grid about-content" ref={contentRef}>
          <div className="rail" ref={railRef}>
            <div className="rail-line" aria-hidden="true">
              <span className="rail-fill" />
            </div>
            {timelineStages.map((s, i) => (
              <button
                key={s.label}
                type="button"
                className={`rail-item${active === i ? " active" : ""}${i < active ? " done" : ""}`}
                onClick={() => goTo(i)}
              >
                <span className="dot" aria-hidden="true" />
                <span className="lbl">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="stage-stack">
            {timelineStages.map((s, i) => (
              <div
                key={s.label}
                className="stage"
                ref={(el) => {
                  stageRefs.current[i] = el;
                }}
              >
                <h2>{renderTitle(s.title, s.keyword, s.accent)}</h2>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
