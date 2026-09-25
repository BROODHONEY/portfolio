"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { projects, type Project } from "@/lib/data";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const pad = (n: number) => String(n + 1).padStart(2, "0");
const accentVars = (p: Project) =>
  ({ "--proj-accent": p.accent, "--proj-accent2": p.accent2 }) as CSSProperties;

// how far (in viewport heights) the section stays pinned after "Selected works" lands
export const WORKS_PIN_ID = "works-pin";
const PIN_LENGTH = 2.2;
// share of the pin during which the intro plays; after that the canvas just stays put
const INTRO_START = 0.08;
const INTRO_END = 0.6;
const VINE_GROW = 2.4; // seconds of intro timeline the side vines take to reach the top

// leaf silhouettes, the same three as the falling leaves in the sky; their
// autumn colours live in CSS (.lc0 to .lc5) so night mode can repaint them
const LEAF_PATHS = [
  "M12 2C7 7 4 12 4 16a8 8 0 0 0 16 0c0-4-3-9-8-14Z",
  "M12 2l2 4.5 4.5-1-2 4 4.5 2-4.5 1.5 1 4.5-4-3-3 3-1-4.5-4.5-1.5 4.5-1L10 6.5Z",
  "M12 3C6 6 3 11 3 15a9 7 0 0 0 18 0c0-4-3-9-9-12Z",
];

// seeded, so server and client render the same scatter
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// A wavy vine grows up each side of the canvas with leaves along it. t is how
// far up the vine a leaf sits (0 = corner, 1 = top), so it appears just as the
// growing tip passes. Every third leaf turns inward, smaller.
const BORDER_LEAVES = (() => {
  const rand = seeded(23);
  const out: { side: "l" | "r"; t: number; s: number; r: number; color: number; shape: number }[] = [];
  (["l", "r"] as const).forEach((side) => {
    const n = 10;
    const dir = side === "l" ? -1 : 1;
    for (let i = 0; i < n; i++) {
      const inward = i % 3 === 2;
      out.push({
        side,
        t: (i + 0.3 + rand() * 0.5) / n,
        s: inward ? 18 + rand() * 8 : 34 + rand() * 24,
        r: Math.round((inward ? -dir : dir) * (40 + rand() * 70) + (rand() - 0.5) * 20),
        color: Math.floor(rand() * 6),
        shape: Math.floor(rand() * LEAF_PATHS.length),
      });
    }
  });
  return out;
})();

// revealed word by word as the drop falls past them
// the line that leads into the works, revealed word by word as you scroll to it
const LEAD_LINES = [["Enough", "about", "me."], ["Here’s", "what", "I’ve", "built."]];

const DRIP_LINES = [["If", "you", "like"], ["what", "I", "did…"]];

const VINE_AMP = 5;
const VINE_WAVE = 150;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/**
 * Selected works: one full-viewport panel that pins to the screen, like
 * "About me". The title holds big and centred; on the first scroll it glides
 * up above a canvas that opens beneath it, where the first project fades in.
 * A leafy vine grows up both sides and along the bottom to the leaf that
 * hangs from the canvas; that leaf's drop is driven from <Drop />. Big
 * arrows slide through the projects in a loop. Scrolling back up plays the
 * whole intro in reverse.
 */
export default function Projects() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const readyRef = useRef(false);
  const busyRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastOpenerRef = useRef<HTMLElement | null>(null);

  const overlayProject = overlayIndex !== null ? projects[overlayIndex] : null;

  const closeOverlay = useCallback(() => {
    setOverlayVisible(false);
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => {
      setOverlayIndex(null);
      lastOpenerRef.current?.focus({ preventScroll: true });
    }, 450);
  }, []);

  const openOverlay = (i: number, from?: HTMLElement) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    if (from) lastOpenerRef.current = from;
    setOverlayIndex(i);
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayVisible(true)));
  };

  const stepOverlay = (dir: 1 | -1) => {
    if (overlayIndex === null) return;
    setOverlayIndex((overlayIndex + dir + projects.length) % projects.length);
    overlayRef.current?.scrollTo({ top: 0 });
  };

  // slide to the next / previous project, wrapping around at both ends
  const go = useCallback(
    (dir: 1 | -1) => {
      if (!readyRef.current || busyRef.current) return;
      const n = projects.length;
      const from = activeRef.current;
      const to = (from + dir + n) % n;
      activeRef.current = to;
      setActive(to);
      if (reduced) return;

      const a = slideRefs.current[from];
      const b = slideRefs.current[to];
      if (!a || !b) return;
      busyRef.current = true;
      gsap
        .timeline({ onComplete: () => (busyRef.current = false) })
        .to(a, { autoAlpha: 0, x: -dir * 90, duration: 0.45, ease: "power2.in" })
        .fromTo(b, { autoAlpha: 0, x: dir * 90 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" }, "-=0.05");
    },
    [reduced]
  );

  // Escape closes the case study, arrows step between projects inside it
  useEffect(() => {
    if (overlayIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeOverlay();
      else if (e.key === "ArrowRight") stepOverlay(1);
      else if (e.key === "ArrowLeft") stepOverlay(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayIndex, closeOverlay]);

  // arrow keys drive the carousel while the section is pinned on screen
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (overlayIndex !== null || !triggerRef.current?.isActive) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, overlayIndex]);

  useEffect(() => {
    document.body.style.overflow = overlayIndex !== null ? "hidden" : "";
    if (overlayIndex !== null) closeBtnRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayIndex !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // (Defined before the works pin on purpose: ScrollTrigger pins must be created in page order,
  // top to bottom, or the later one measures its start before the earlier one's spacing exists.)
  // The lead-in is a screen that pins while its words appear one after another: the further
  // you scroll, the more of the line is written (and it un-writes as you scroll back).
  // It only pins once About has scrolled completely off.
  useEffect(() => {
    const lead = leadRef.current;
    if (!lead || reduced) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: lead,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 1.3)}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(".lead-word", { opacity: 0, y: 18 }, { opacity: 1, y: 0, ease: "none", stagger: 0.22, duration: 0.5 });
      // the finished line rests for a moment before the pin lets go
      tl.to({}, { duration: 0.6 });
    }, lead);
    return () => ctx.revert();
  }, [reduced]);

  // The whole section is one full-viewport panel that pins to the screen:
  //   1. "Selected works" holds big and centered,
  //   2. on the first scroll it bounces up to the top while the canvas opens,
  //   3. the first project fades in slowly, arrows and the leaf settle in,
  //   4. the pin releases and the leaf's drop falls (see Drop.tsx).
  useEffect(() => {
    const pin = pinRef.current;
    const title = titleRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const chrome = chromeRef.current;
    const leaf = leafRef.current;
    const layer = leavesRef.current;
    if (!pin || !title || !canvas || !stage || !chrome || !leaf || !layer) return;
    if (reduced) return;

    let scaleTarget = 1;
    let targetY = 0;

    // the title stays centred; it only rises to sit just above the canvas
    const measure = () => {
      const vh = pin.clientHeight;
      gsap.set(title, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
      scaleTarget = Math.min(52, window.innerWidth * 0.11) / parseFloat(getComputedStyle(title).fontSize);
      const canvasTop = canvas.offsetTop;
      targetY = canvasTop - 38 - vh / 2;
    };

    // The vine is drawn in pixels against the canvas box: two wavy runs up the
    // sides and two along the bottom that meet under the hanging leaf. Only the
    // path data and leaf positions depend on size, so a resize just re-lays them.
    const vine = (q: string) => layer.querySelector<SVGPathElement>(q);
    const layout = () => {
      const w = layer.clientWidth;
      const h = layer.clientHeight;
      const wave = (u: number, amp: number, len: number) => amp * Math.sin((u / len) * Math.PI * 2);
      const side = (sign: 1 | -1) => {
        let d = "";
        for (let y = h; y >= -1; y -= 6) d += `${d ? "L" : "M"}${((sign < 0 ? 0 : w) + sign * -wave(h - y, VINE_AMP, VINE_WAVE)).toFixed(1)} ${y}`;
        return d;
      };
      const bottom = (from: 0 | 1) => {
        let d = "";
        for (let u = 0; u <= w / 2; u += 6) {
          // the wave dies out towards the middle so both runs meet exactly at the stem
          const taper = clamp01((w / 2 - u) / 80);
          d += `${d ? "L" : "M"}${(from === 0 ? u : w - u).toFixed(1)} ${(h + wave(u, 3, 150) * taper).toFixed(1)}`;
        }
        return d;
      };
      vine(".vine-l")?.setAttribute("d", side(-1));
      vine(".vine-r")?.setAttribute("d", side(1));
      vine(".vine-bl")?.setAttribute("d", bottom(0));
      vine(".vine-br")?.setAttribute("d", bottom(1));

      layer.querySelectorAll<HTMLElement>(".border-leaf").forEach((el, i) => {
        const l = BORDER_LEAVES[i];
        const y = h * (1 - l.t);
        const sign = l.side === "l" ? -1 : 1;
        el.style.left = `${((l.side === "l" ? 0 : w) + sign * -wave(h - y, VINE_AMP, VINE_WAVE)).toFixed(1)}px`;
        el.style.top = `${y.toFixed(1)}px`;
      });
    };
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(layer);

    const ctx = gsap.context(() => {
      layout();
      measure();
      gsap.set(slideRefs.current[0], { autoAlpha: 1 });

      // The intro is scrubbed by the scroll (with a short glide, like "About me"), so
      // scrolling back plays every part of it in reverse: vine, canvas, title.
      const intro = gsap.timeline({ paused: true });
      intro
        // the title rises, smoothly, to sit right above the canvas
        .to(title, { y: () => targetY, scale: () => scaleTarget, duration: 1.4, ease: "power3.inOut" }, 0)
        // the canvas opens from a point at its centre while the title is on its way
        .fromTo(
          canvas,
          { autoAlpha: 0, clipPath: "inset(49% 49% 49% 49% round 6px)" },
          { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0% round 6px)", duration: 1.3, ease: "power4.inOut" },
          0.5
        )
        // the vine grows from the two bottom corners: up each side, and along
        // the bottom towards the hanging leaf. Each leaf opens as the tip passes it.
        .fromTo(layer.querySelectorAll(".vine-l, .vine-r"), { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: VINE_GROW, ease: "none" }, 1.4)
        .fromTo(layer.querySelectorAll(".vine-bl, .vine-br"), { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.8, ease: "none" }, 1.4)
        // AWP fades in, slowly
        .fromTo(stage, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.6, ease: "power2.out" }, 1.6)
        .fromTo(chrome, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 2.6)
        // the vines reach the middle and the hanging leaf unfurls
        .fromTo(
          leaf,
          { autoAlpha: 0, scaleY: 0.2, rotation: -34 },
          { autoAlpha: 1, scaleY: 1, rotation: 0, duration: 1, ease: "back.out(1.6)" },
          3.1
        );

      // leaves pop open along the vine, timed to its growth
      layer.querySelectorAll<SVGElement>(".border-leaf svg").forEach((el, i) => {
        intro.fromTo(
          el,
          { autoAlpha: 0, scale: 0 },
          { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" },
          1.4 + BORDER_LEAVES[i].t * VINE_GROW
        );
      });
      const introEnd = intro.duration();

      // back at the top: the next visit starts on AWP again
      const resetSlides = () => {
        slideRefs.current.forEach((el, i) => gsap.set(el, { autoAlpha: i === 0 ? 1 : 0, x: 0 }));
        activeRef.current = 0;
        busyRef.current = false;
        setActive(0);
      };

      let goal = 0;
      const follow = (to: number) => {
        goal = to;
        gsap.to(intro, {
          progress: to,
          duration: 0.7,
          ease: "power2.out",
          overwrite: true,
          onUpdate: () => {
            readyRef.current = intro.time() >= introEnd - 0.5;
          },
          onComplete: () => {
            if (to === 0) resetSlides();
          },
        });
      };

      triggerRef.current = ScrollTrigger.create({
        id: WORKS_PIN_ID,
        trigger: pin,
        start: "top top",
        end: () => `+=${Math.round(pin.clientHeight * PIN_LENGTH)}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: () => {
          // sizes may have changed: re-measure from the untouched state, then put the playhead back
          intro.progress(0);
          measure();
          intro.invalidate().progress(goal);
        },
        onUpdate: (self) => {
          const to = clamp01((self.progress - INTRO_START) / (INTRO_END - INTRO_START));
          if (Math.abs(to - goal) > 0.0005) follow(to);
        },
      });
    }, sectionRef);

    return () => {
      readyRef.current = false;
      triggerRef.current = null;
      resizeObserver.disconnect();
      ctx.revert();
    };
  }, [reduced]);

  // layout can shift after first paint (web fonts arriving); pins measure positions, so re-measure
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  // reduced motion has no intro: everything is simply there
  useEffect(() => {
    if (reduced) readyRef.current = true;
  }, [reduced]);

  const current = projects[active];

  return (
    <>
    <section className={reduced ? "works-lead reduced" : "works-lead"} ref={leadRef} aria-label="Selected works, introduction">
      {LEAD_LINES.map((line, li) => (
        <p key={li} className="lead-line">
          {line.map((word, wi) => (
            <span key={wi} className="lead-word">
              {word}
            </span>
          ))}
        </p>
      ))}
    </section>
    <section id="projects" ref={sectionRef} className={reduced ? "reduced" : undefined}>
      <div className="works-pin" ref={pinRef}>
        <h2 className="works-title" ref={titleRef}>
          Selected works
        </h2>

        <div className="works-canvas" ref={canvasRef} style={accentVars(current)}>
          <div className="works-stage" ref={stageRef} aria-live="polite">
            {projects.map((p, i) => (
              <div
                key={p.key}
                className={`works-slide${active === i ? " on" : ""}`}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                style={accentVars(p)}
                aria-hidden={active !== i}
              >
                <div className="ws-text">
                  <div className="ws-meta mono">
                    <span>{pad(i)}</span>
                    <span>/</span>
                    <span>{pad(projects.length - 1)}</span>
                    <span className="ws-tag">{p.tag}</span>
                  </div>
                  <h3 className="ws-title">{p.title}</h3>
                  <p className="ws-what">{p.summary.what}</p>
                  <dl className="ws-facts mono">
                    <div>
                      <dt>Year</dt>
                      <dd>{p.year}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{p.status}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="ws-open mono"
                    tabIndex={active === i ? 0 : -1}
                    onClick={(e) => openOverlay(i, e.currentTarget)}
                    data-cursor="view"
                    data-cursor-accent={p.accent}
                  >
                    Open case study ↗
                  </button>
                </div>
                <div className="ws-art" aria-hidden="true">
                  <svg>
                    <use href={`#${p.diagram}`} />
                  </svg>
                  <span className="ws-cap mono">{p.caption}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="works-chrome" ref={chromeRef}>
            <button type="button" className="works-arrow prev" onClick={() => go(-1)} aria-label="Previous project">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path d="M54 32H12M30 12L10 32l20 20" />
              </svg>
            </button>
            <button type="button" className="works-arrow next" onClick={() => go(1)} aria-label="Next project">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path d="M10 32h42M34 12l20 20-20 20" />
              </svg>
            </button>
            <div className="works-count mono" aria-hidden="true">
              {pad(active)} / {pad(projects.length - 1)}
            </div>
          </div>
        </div>

        {/* a wavy vine along the sides and bottom of the canvas, with leaves on the sides only */}
        <div className="works-leaves" ref={leavesRef} aria-hidden="true">
          <svg className="works-vine">
            {["vine-l", "vine-r", "vine-bl", "vine-br"].map((c) => (
              <path key={c} className={`vine ${c}`} pathLength={100} />
            ))}
          </svg>
          {BORDER_LEAVES.map((l, i) => (
            <span
              key={i}
              className="border-leaf"
              style={{ "--s": l.s.toFixed(1), "--r": `${l.r}deg` } as CSSProperties}
            >
              <svg viewBox="0 0 24 24">
                <path className={`lc${l.color}`} d={LEAF_PATHS[l.shape]} />
                <path className="rib" d="M12 21V6" fill="none" />
              </svg>
            </span>
          ))}
        </div>

        {/* the leaf hangs from the bottom-centre of the canvas; its tip is where the drop forms */}
        <div className="works-leaf" ref={leafRef} aria-hidden="true">
          <div className="works-leaf-sway">
            <svg viewBox="0 0 80 132" width="80" height="132">
              <path className="leaf-stem" d="M40 0V30" />
              <path className="leaf-blade" d="M40 28C10 46 8 98 40 128C72 98 70 46 40 28Z" />
              <path className="leaf-vein" d="M40 30V120M40 52L24 64M40 52L56 64M40 74L20 88M40 74L60 88M40 96L28 106M40 96L52 106" />
              <circle data-leaf-tip cx="40" cy="128" r="1" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* the stretch between the leaf and the sea: the drop writes this as it falls (see Drop.tsx) */}
      <div className="works-drip">
        {DRIP_LINES.map((line, li) => (
          <p key={li} className="drip-line">
            {line.map((word, wi) => (
              <span key={wi} className="drip-word" data-k={wi}>
                {word}
              </span>
            ))}
          </p>
        ))}
      </div>

      {overlayProject && (
        <div
          ref={overlayRef}
          className={`overlay${overlayVisible ? " open" : ""}`}
          style={accentVars(overlayProject)}
          role="dialog"
          aria-modal="true"
          aria-label={`${overlayProject.title} case study`}
          data-lenis-prevent
        >
          <button
            ref={closeBtnRef}
            className="ov-close"
            onClick={closeOverlay}
            data-cursor="default"
            aria-label="Close case study"
          >
            Close ✕
          </button>

          <div className="ov-inner" key={overlayProject.key}>
            <div className="ov-top mono">
              <span>{pad(overlayIndex!)}</span>
              <span>/</span>
              <span>{pad(projects.length - 1)}</span>
              <span className="ov-top-tag">{overlayProject.caseStudy.tag}</span>
            </div>

            <h2>{overlayProject.caseStudy.title}</h2>

            <div className="ov-hero">
              <svg aria-hidden="true">
                <use href={`#${overlayProject.diagram}`} />
              </svg>
              <dl className="ov-facts mono">
                <div>
                  <dt>Year</dt>
                  <dd>{overlayProject.year}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{overlayProject.status}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{overlayProject.tag}</dd>
                </div>
              </dl>
            </div>

            <div className="ov-sections">
              <div>
                <h4 className="mono">What</h4>
                <p>{overlayProject.summary.what}</p>
              </div>
              <div>
                <h4 className="mono">How</h4>
                <p>{overlayProject.summary.how}</p>
              </div>
              <div>
                <h4 className="mono">Next</h4>
                <p>{overlayProject.summary.next}</p>
              </div>
            </div>

            <ul className="ov-stack mono" aria-label="Stack">
              {overlayProject.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>

            {overlayProject.links.length > 0 && (
              <div className="ov-links mono">
                {overlayProject.links.map((l) => (
                  <a key={l.label} href={l.href} data-cursor="external" data-cursor-accent={overlayProject.accent}>
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}

            <div className="ov-nav mono">
              <button onClick={() => stepOverlay(-1)} aria-label="Previous project">
                ← {projects[(overlayIndex! - 1 + projects.length) % projects.length].title}
              </button>
              <button onClick={() => stepOverlay(1)} aria-label="Next project">
                {projects[(overlayIndex! + 1) % projects.length].title} →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
    </>
  );
}
