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

  const shown = hovered ?? projects[0];

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
    <section id="projects">
      <div className="col-grid">
        <div className="section-label">
          Projects
        </div>

        <div className="proj-cols">
          <div className="proj-list" onMouseLeave={() => setHovered(null)}>
            {projects.map((p) => (
              <div
                key={p.key}
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
