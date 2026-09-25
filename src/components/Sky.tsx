"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Star = { top: number; left: number; size: number; delay: number; duration: number; twinkle: boolean };
type ShootingStar = { top: number; left: number; angle: number; length: number; delay: number; duration: number };
type Bird = { top: number; delay: number; duration: number; scale: number };
type Leaf = {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
  shape: number;
  color: string;
};

// three silhouettes — slender, maple-pointed, round — so the fall doesn't
// look like a single stamp repeated, plus a warm autumn palette per leaf
const LEAF_SHAPES = [
  "M12 2C7 7 4 12 4 16a8 8 0 0 0 16 0c0-4-3-9-8-14Z",
  "M12 2l2 4.5 4.5-1-2 4 4.5 2-4.5 1.5 1 4.5-4-3-3 3-1-4.5-4.5-1.5 4.5-1L10 6.5Z",
  "M12 3C6 6 3 11 3 15a9 7 0 0 0 18 0c0-4-3-9-9-12Z",
];
const AUTUMN_COLORS = ["#ff4d23", "#c1440e", "#e3a857", "#d9822b", "#8a3324", "#f2b134"];
type Wind = { top: number; delay: number; duration: number };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// spreads n items evenly across [0,100) in bands, with a random jitter inside
// each band — guarantees even coverage instead of leaving random clusters/gaps
function evenSpread(n: number): number[] {
  const band = 100 / n;
  return Array.from({ length: n }, (_, i) => i * band + rand(band * 0.1, band * 0.9));
}

function makeStars(n: number): Star[] {
  const lefts = evenSpread(n);
  return Array.from({ length: n }, (_, i) => ({
    top: rand(0, 100),
    left: lefts[i],
    size: rand(1, 2.6),
    delay: rand(0, 6),
    duration: rand(2.4, 5.4),
    twinkle: Math.random() < 0.6,
  }));
}

function makeShootingStars(n: number): ShootingStar[] {
  return Array.from({ length: n }, () => ({
    top: rand(2, 55),
    left: rand(0, 70),
    angle: rand(18, 34),
    length: rand(80, 140),
    delay: rand(0, 40),
    duration: rand(16, 26),
  }));
}

function makeBirds(n: number): Bird[] {
  return Array.from({ length: n }, () => ({
    top: rand(8, 55),
    delay: rand(0, 26),
    duration: rand(16, 24),
    scale: rand(0.7, 1.15),
  }));
}

function makeLeaves(n: number): Leaf[] {
  const lefts = evenSpread(n);
  return Array.from({ length: n }, (_, i) => ({
    left: lefts[i],
    // the fall itself only fills the first ~48% of the animation (see the
    // leaf-fall keyframes) — wide, mostly non-overlapping delay/duration
    // per leaf so they drop individually, not all at once, and each one
    // only falls occasionally rather than constantly cycling
    delay: rand(0, 42),
    duration: rand(26, 40),
    drift: rand(-60, 60),
    spin: rand(220, 420) * (Math.random() < 0.5 ? -1 : 1),
    size: rand(20, 34),
    shape: Math.floor(rand(0, LEAF_SHAPES.length)),
    color: AUTUMN_COLORS[Math.floor(rand(0, AUTUMN_COLORS.length))],
  }));
}

function makeWind(n: number): Wind[] {
  return Array.from({ length: n }, () => ({
    top: rand(15, 80),
    delay: rand(0, 18),
    duration: rand(9, 14),
  }));
}

/** Ambient, theme-aware backdrop: a moonlit atmosphere + starfield for dark
 * mode, a light breeze of birds/leaves/wind for the sun's theme. Purely
 * decorative (aria-hidden), rendered only after mount so the randomized
 * layout never disagrees with the server-rendered HTML. */
type SkyData = {
  stars: Star[];
  shooting: ShootingStar[];
  birds: Bird[];
  leaves: Leaf[];
  wind: Wind[];
};

export default function Sky() {
  const reduced = useReducedMotion();
  const [sky, setSky] = useState<SkyData | null>(null);

  useEffect(() => {
    if (reduced) return;
    // the randomized layout can only be generated client-side, so it's
    // necessarily set here rather than during render — there's no server
    // snapshot for it to match, unlike useTheme/useReducedMotion above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSky({
      stars: makeStars(80),
      shooting: makeShootingStars(3),
      birds: makeBirds(3),
      leaves: makeLeaves(7),
      wind: makeWind(3),
    });
  }, [reduced]);

  const { stars, shooting, birds, leaves, wind } = sky ?? {
    stars: null,
    shooting: null,
    birds: null,
    leaves: null,
    wind: null,
  };

  return (
    <>
      <div className="atmosphere" aria-hidden="true" />

      <div className="starfield" aria-hidden="true">
        {stars?.map((s, i) => (
          <span
            key={i}
            className={`star${s.twinkle ? " twinkle" : ""}`}
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
        {shooting?.map((s, i) => (
          <span
            key={`sh${i}`}
            className="shooting-star"
            style={
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                "--angle": `${s.angle}deg`,
                "--len": `${s.length}px`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="daylight" aria-hidden="true">
        {wind?.map((w, i) => (
          <svg
            key={`w${i}`}
            className="wind"
            viewBox="0 0 120 20"
            style={{ top: `${w.top}%`, animationDelay: `${w.delay}s`, animationDuration: `${w.duration}s` }}
          >
            <path d="M2 10 Q30 2 58 10 T114 10" stroke="currentColor" strokeWidth="1.3" fill="none" strokeDasharray="3 6" strokeLinecap="round" />
          </svg>
        ))}

        {leaves?.map((l, i) => (
          <svg
            key={`l${i}`}
            className="leaf"
            viewBox="0 0 24 24"
            style={
              {
                left: `${l.left}%`,
                width: l.size,
                height: l.size,
                color: l.color,
                animationDelay: `${l.delay}s`,
                animationDuration: `${l.duration}s`,
                "--drift": `${l.drift}px`,
                "--spin": `${l.spin}deg`,
              } as CSSProperties
            }
          >
            <path d={LEAF_SHAPES[l.shape]} fill="currentColor" opacity="0.9" />
            <path d="M12 4V20" stroke="var(--bg)" strokeWidth="0.8" opacity="0.5" />
          </svg>
        ))}

        {birds?.map((b, i) => (
          <span
            key={`b${i}`}
            className="bird"
            style={
              {
                top: `${b.top}%`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
                "--bscale": b.scale,
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 20 12" className="wing-a">
              <path d="M1 9 Q5 3 10 9 Q15 3 19 9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 20 12" className="wing-b">
              <path d="M1 7 Q5 11 10 7 Q15 11 19 7" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        ))}
      </div>
    </>
  );
}
