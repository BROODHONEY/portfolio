"use client";

import { useTheme, toggleTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const theme = useTheme();

  return (
    <>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        data-cursor="default"
      >
        <svg className="celestial" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sunGlow" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#fff3d6" />
              <stop offset="45%" stopColor="#ffcf6b" />
              <stop offset="100%" stopColor="var(--accent)" />
            </radialGradient>
            <radialGradient id="moonGlow" cx="34%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#dfe9ff" />
              <stop offset="100%" stopColor="#a9bde6" />
            </radialGradient>
            <clipPath id="moonClip">
              <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 1 0 20.354 15.354Z" />
            </clipPath>
          </defs>
          <g className="sun-group">
            <circle className="corona" cx="12" cy="12" r="9" fill="url(#sunCorona)" />
            <g className="rays" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
            <circle className="core" cx="12" cy="12" r="5" fill="url(#sunGlow)" />
          </g>
          <g className="moon-group">
            <path
              fill="url(#moonGlow)"
              d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 1 0 20.354 15.354Z"
            />
            <g className="craters" fill="#93a8d1" clipPath="url(#moonClip)">
              <circle cx="7.2" cy="15.2" r="1.5" />
              <circle cx="11.4" cy="18.3" r="1" />
              <circle cx="8.6" cy="9.8" r="0.8" />
              <circle cx="13.6" cy="14.4" r="0.6" />
            </g>
          </g>
        </svg>
      </button>
    </>
  );
}
