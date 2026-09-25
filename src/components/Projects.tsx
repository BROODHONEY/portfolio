"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { projects, type Project } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

const pad = (n: number) => String(n + 1).padStart(2, "0");
const accentVars = (p: Project) =>
  ({ "--proj-accent": p.accent, "--proj-accent2": p.accent2 }) as CSSProperties;

/**
 * "The Index": one oversized title per project on a hard rule. Hovering a
 * row dims the rest and a diagram sheet follows the cursor; clicking opens
 * a full-screen case study.
 */
export default function Projects() {
  const [hovered, setHovered] = useState<Project | null>(null);
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const floatRef = useRef<HTMLDivElement>(null);
  const floatRevealRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastRowRef = useRef<HTMLElement | null>(null);
  const moveRef = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  const overlayProject = overlayIndex !== null ? projects[overlayIndex] : null;

  const closeOverlay = useCallback(() => {
    setOverlayVisible(false);
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => {
      setOverlayIndex(null);
      lastRowRef.current?.focus({ preventScroll: true });
    }, 450);
  }, []);

  const openOverlay = (i: number, from?: HTMLElement) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    if (from) lastRowRef.current = from;
    setHovered(null);
    setOverlayIndex(i);
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayVisible(true)));
  };

  const step = (dir: 1 | -1) => {
    if (overlayIndex === null) return;
    setOverlayIndex((overlayIndex + dir + projects.length) % projects.length);
    overlayRef.current?.scrollTo({ top: 0 });
  };

  // Escape closes, arrows step between projects
  useEffect(() => {
    if (overlayIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeOverlay();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayIndex, closeOverlay]);

  useEffect(() => {
    document.body.style.overflow = overlayIndex !== null ? "hidden" : "";
    if (overlayIndex !== null) closeBtnRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayIndex !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // cursor-following diagram sheet (fine pointers only)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!floatRef.current || !fine) return;
    gsap.set(floatRef.current, { xPercent: 0, yPercent: -50 });
    moveRef.current = {
      x: gsap.quickTo(floatRef.current, "x", { duration: reduced ? 0 : 0.6, ease: "power3.out" }),
      y: gsap.quickTo(floatRef.current, "y", { duration: reduced ? 0 : 0.6, ease: "power3.out" }),
    };
  }, []);

  // the sheet lifts in like the paper being pulled up whenever the project changes
  useEffect(() => {
    if (!hovered || !floatRevealRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(floatRevealRef.current, { clipPath: "inset(0% 0% 0% 0%)" });
      return;
    }
    gsap.fromTo(
      floatRevealRef.current,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.out" }
    );
  }, [hovered?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // entrance: label, then the rows wipe in one after another
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = rowRefs.current.filter((r): r is HTMLDivElement => !!r);

    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.set(headRef.current, { opacity: 0, y: 14 });
      gsap.set(rows, { opacity: 0, y: 28 });
      gsap
        .timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } })
        .to(headRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
        .to(
          rows,
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", clearProps: "transform" },
          "-=0.25"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const onListMove = (e: React.MouseEvent) => {
    moveRef.current?.x(e.clientX + 28);
    moveRef.current?.y(e.clientY);
  };

  return (
    <section id="projects" ref={sectionRef}>
      <div className="col-grid">
        <div className="works-head" ref={headRef}>
          <div className="section-label">Works</div>
          <div className="works-count mono">{pad(projects.length - 1)} projects</div>
        </div>

        <div
          className="works-list"
          onMouseMove={onListMove}
          onMouseLeave={() => setHovered(null)}
        >
          {projects.map((p, i) => (
            <div
              key={p.key}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className={`works-row${hovered && hovered.key !== p.key ? " dim" : ""}${
                hovered?.key === p.key ? " on" : ""
              }`}
              style={{ "--row-accent": p.accent } as CSSProperties}
              data-cursor="view"
              data-cursor-accent={p.accent}
              role="button"
              tabIndex={0}
              aria-label={`Open ${p.title} case study`}
              onMouseEnter={() => setHovered(p)}
              onFocus={() => setHovered(p)}
              onBlur={() => setHovered(null)}
              onClick={(e) => openOverlay(i, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openOverlay(i, e.currentTarget);
                }
              }}
            >
              <span className="works-num mono">{pad(i)}</span>
              <h3 className="works-title">{p.title}</h3>
              <span className="works-meta mono">
                <span>{p.tag}</span>
                <span className="works-arrow" aria-hidden="true">
                  →
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* cursor-following diagram sheet */}
      <div
        className={`works-float${hovered && overlayIndex === null ? " show" : ""}`}
        ref={floatRef}
        style={accentVars(hovered ?? projects[0])}
        aria-hidden="true"
      >
        <div className="works-float-sheet" ref={floatRevealRef}>
          <svg>
            <use href={`#${(hovered ?? projects[0]).diagram}`} />
          </svg>
          <div className="works-float-cap mono">{(hovered ?? projects[0]).caption}</div>
        </div>
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
              <button onClick={() => step(-1)} aria-label="Previous project">
                ← {projects[(overlayIndex! - 1 + projects.length) % projects.length].title}
              </button>
              <button onClick={() => step(1)} aria-label="Next project">
                {projects[(overlayIndex! + 1) % projects.length].title} →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
