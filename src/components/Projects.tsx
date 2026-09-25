"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import gsap from "gsap";
import { projects, type Project } from "@/lib/data";

export default function Projects() {
  const [hovered, setHovered] = useState<Project | null>(null);
  const [overlayProject, setOverlayProject] = useState<Project | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewInnerRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const featured = projects.find((p) => p.key === "awp") ?? projects[0];
  const rest = projects.filter((p) => p.key !== featured.key);
  const shown = hovered ?? rest[0];

  const closeOverlay = () => {
    setOverlayVisible(false);
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOverlayProject(null), 450);
  };

  const openOverlay = (p: Project) => {
    setOverlayProject(p);
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayVisible(true)));
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && overlayProject) closeOverlay();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [overlayProject]);

  useEffect(() => {
    document.body.style.overflow = overlayProject ? "hidden" : "";
  }, [overlayProject]);

  // the preview panel reveals like a sheet being pulled into view, not a plain fade
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!previewRef.current) return;
    if (reduced) {
      gsap.set(previewRef.current, { clipPath: "inset(0% 0% 0% 0%)" });
      return;
    }
    gsap.fromTo(
      previewRef.current,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power3.out" }
    );
  }, [shown.key]);

  // entering the section: the label fades up, the featured project unrolls
  // like a sheet (same idea as the preview panel above), then the list
  // falls in underneath — one coordinated reveal, not a plain fade.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = rowRefs.current.filter((r): r is HTMLDivElement => !!r);

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([labelRef.current, previewStageRef.current, ...rows], { opacity: 1, y: 0 });
        gsap.set(featuredRef.current, { clipPath: "inset(0% 0% 0% 0%)" });
        return;
      }

      gsap.set(labelRef.current, { opacity: 0, y: 14 });
      gsap.set(featuredRef.current, { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(previewStageRef.current, { opacity: 0, y: 14 });
      gsap.set(rows, { opacity: 0, y: 20 });

      gsap
        .timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top 75%" } })
        .to(labelRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
        .to(
          featuredRef.current,
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.out" },
          "-=0.25"
        )
        .to(
          rows,
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power3.out" },
          "-=0.45"
        )
        .to(previewStageRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.5");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const onPreviewMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
    const py = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
    gsap.to(previewInnerRef.current, { x: px * 14, y: py * 14, duration: 0.5, ease: "power2.out" });
  };
  const onPreviewLeave = () => {
    gsap.to(previewInnerRef.current, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
  };

  return (
    <section id="projects" ref={sectionRef}>
      <div className="col-grid">
        <div className="section-label" ref={labelRef}>
          Works
        </div>

        <div
          className="proj-featured"
          ref={featuredRef}
          style={
            {
              "--proj-accent": featured.accent,
              "--proj-accent2": featured.accent2,
            } as CSSProperties
          }
          data-cursor="view"
          data-cursor-accent={featured.accent}
          role="button"
          tabIndex={0}
          aria-label={`Open ${featured.title} case study`}
          onClick={() => openOverlay(featured)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openOverlay(featured);
            }
          }}
        >
          <div className="pf-wash" />
          <div className="pf-body">
            <div className="pf-meta mono">Featured Work — {featured.tag}</div>
            <h3 className="pf-title">{featured.title}</h3>
            <p className="pf-caption">{featured.caption}</p>
            <div className="pf-cta mono">
              View case study <span className="pf-arrow">→</span>
            </div>
          </div>
          <div className="pf-diagram">
            <svg>
              <use href={`#${featured.diagram}`} />
            </svg>
          </div>
        </div>

        <div className="proj-cols">
          <div className="proj-list" onMouseLeave={() => setHovered(null)}>
            {rest.map((p, i) => (
              <div
                key={p.key}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className="proj-row"
                data-cursor="view"
                data-cursor-accent={p.accent}
                style={{ "--row-accent": p.accent } as CSSProperties}
                role="button"
                tabIndex={0}
                aria-label={`Open ${p.title} case study`}
                onMouseEnter={() => setHovered(p)}
                onFocus={() => setHovered(p)}
                onClick={() => openOverlay(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openOverlay(p);
                  }
                }}
              >
                <h3 className="proj-title">{p.title}</h3>
                <div className="proj-tag">{p.tag}</div>
              </div>
            ))}
          </div>

          <div
            className="preview-stage"
            ref={previewStageRef}
            style={
              {
                "--proj-accent": shown.accent,
                "--proj-accent2": shown.accent2,
              } as CSSProperties
            }
            onMouseMove={onPreviewMove}
            onMouseLeave={onPreviewLeave}
          >
            <div className={`preview-wash${hovered ? " on" : ""}`} />
            <div className="preview-reveal" ref={previewRef}>
              <div className="preview-inner" ref={previewInnerRef}>
                <svg className="preview-svg">
                  <use href={`#${shown.diagram}`} />
                </svg>
              </div>
            </div>
            <div className="preview-caption mono">{hovered ? hovered.caption : "Hover a project"}</div>
          </div>
        </div>
      </div>

      {overlayProject && (
        <div
          className={`overlay${overlayVisible ? " open" : ""}`}
          style={
            {
              "--proj-accent": overlayProject.accent,
              "--proj-accent2": overlayProject.accent2,
            } as CSSProperties
          }
        >
          <button className="ov-close" onClick={closeOverlay} data-cursor="default" aria-label="Close case study">
            Close ✕
          </button>
          <div className="ov-inner">
            <div className="ov-tag mono">{overlayProject.caseStudy.tag}</div>
            <h2>{overlayProject.caseStudy.title}</h2>
            <svg>
              <use href={`#${overlayProject.diagram}`} />
            </svg>
            <p>{overlayProject.caseStudy.body}</p>
          </div>
        </div>
      )}
    </section>
  );
}
