"use client";

import * as React from "react";
import "./panda-mascot.css";

export type PandaMood = "idle" | "cheer" | "worry" | "win";

export function PandaMascot({
  size = 140,
  mood = "idle",
  className = "",
  hanging = false,
  walking = false,
  note,
}: {
  size?: number;
  mood?: PandaMood;
  className?: string;
  hanging?: boolean;
  walking?: boolean;
  note?: string;
}) {
  const [blink, setBlink] = React.useState(false);
  const [look, setLook] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    let a = 0;
    let b = 0;
    let alive = true;
    const blinkSoon = () => {
      a = window.setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        window.setTimeout(() => alive && setBlink(false), 120);
        blinkSoon();
      }, 2200 + Math.random() * 2800);
    };
    const lookSoon = () => {
      b = window.setTimeout(() => {
        if (!alive) return;
        setLook((Math.random() - 0.5) * 8);
        lookSoon();
      }, 1800 + Math.random() * 2200);
    };
    blinkSoon();
    lookSoon();
    return () => {
      alive = false;
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  const moodCls = `panda-${mood}`;
  const hangCls = hanging ? "is-hanging" : "";
  const walkCls = walking ? "is-walking" : "";
  const blinkCls = blink ? "is-blink" : "";
  const hoverCls = hovered ? "is-hovered" : "";

  /* Mouth path per mood */
  const mouth =
    mood === "cheer"
      ? "M88 112c5 8 19 8 24 0"    /* big grin */
      : mood === "worry"
        ? "M91 114c3-4 15-4 18 0"   /* small frown */
        : mood === "win"
          ? "M86 111c6 10 22 10 28 0"/* huge smile */
          : "M92 112c4 5 12 5 16 0"; /* gentle smile */

  /* Eyebrow tilt per mood */
  const browL =
    mood === "worry"
      ? "M66 74l12-5"
      : mood === "cheer" || mood === "win"
        ? "M66 72l12 2"
        : "M68 72l10 0";
  const browR =
    mood === "worry"
      ? "M122 69l12 5"
      : mood === "cheer" || mood === "win"
        ? "M122 74l12-2"
        : "M122 72l10 0";

  return (
    <span
      className={`bek-panda ${moodCls} ${hangCls} ${walkCls} ${blinkCls} ${hoverCls} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {note ? <span className="panda-bubble">{note}</span> : null}

      <svg viewBox="0 0 200 240" className="bek-panda-svg">
        <defs>
          {/* Fur texture filter */}
          <filter id="panda-fur">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" />
          </filter>
          {/* Soft shadow */}
          <filter id="panda-shadow">
            <feGaussianBlur stdDeviation="3" />
            <feOffset dy="2" />
            <feComposite in="SourceGraphic" />
          </filter>
          {/* Glow for win sparkles */}
          <filter id="panda-glow">
            <feGaussianBlur stdDeviation="2.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Radial gradient for body depth */}
          <radialGradient id="belly-grad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#e8e8e8" />
          </radialGradient>
          <radialGradient id="face-grad" cx="50%" cy="42%" r="52%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0efed" />
          </radialGradient>
          <linearGradient id="cap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#2d2d2d" />
          </linearGradient>
          <linearGradient id="cap-board" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#222" />
            <stop offset="100%" stopColor="#111" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse className="bek-shadow" cx="100" cy="224" rx="44" ry="8" fill="rgb(15 23 42 / 0.14)" />

        <g className="bek-body">
          {/* === TAIL === */}
          <g className="bek-tail">
            <ellipse cx="60" cy="176" rx="10" ry="8" fill="#1e1e1e" transform="rotate(-20, 60, 176)" />
            <ellipse cx="58" cy="174" rx="5" ry="4" fill="#333" transform="rotate(-20, 58, 174)" />
          </g>

          {/* === LEGS === */}
          <g className="bek-leg bek-leg-l">
            <path d="M76 158c-6 10-8 28-4 38 2 6 8 10 14 8 8-4 10-18 8-30-2-12-8-20-14-20-2 0-4 2-4 4z" fill="#1a1a1a" />
            {/* Paw pad */}
            <ellipse cx="82" cy="198" rx="13" ry="8" fill="#141414" />
            <ellipse cx="79" cy="196" rx="4" ry="3" fill="#3a3535" opacity="0.5" />
            <ellipse cx="86" cy="196" rx="3" ry="2.5" fill="#3a3535" opacity="0.5" />
            <ellipse cx="82" cy="200" rx="5" ry="3" fill="#3a3535" opacity="0.5" />
          </g>
          <g className="bek-leg bek-leg-r">
            <path d="M124 158c6 10 8 28 4 38-2 6-8 10-14 8-8-4-10-18-8-30 2-12 8-20 14-20 2 0 4 2 4 4z" fill="#1a1a1a" />
            <ellipse cx="118" cy="198" rx="13" ry="8" fill="#141414" />
            <ellipse cx="115" cy="196" rx="4" ry="3" fill="#3a3535" opacity="0.5" />
            <ellipse cx="122" cy="196" rx="3" ry="2.5" fill="#3a3535" opacity="0.5" />
            <ellipse cx="118" cy="200" rx="5" ry="3" fill="#3a3535" opacity="0.5" />
          </g>

          {/* === ARMS === */}
          <g className="bek-arm bek-arm-l">
            <path d="M60 118c-14 8-22 28-16 42 4 8 12 10 18 4 8-10 12-26 8-38-2-6-6-10-10-8z" fill="#1c1c1c" />
            {/* Paw */}
            <ellipse cx="48" cy="158" rx="11" ry="9" fill="#141414" />
            <ellipse cx="45" cy="156" rx="3.5" ry="2.5" fill="#3a3535" opacity="0.5" />
            <ellipse cx="51" cy="155" rx="3" ry="2.5" fill="#3a3535" opacity="0.5" />
          </g>
          <g className="bek-arm bek-arm-r">
            <path d="M140 118c14 8 22 28 16 42-4 8-12 10-18 4-8-10-12-26-8-38 2-6 6-10 10-8z" fill="#1c1c1c" />
            <ellipse cx="152" cy="158" rx="11" ry="9" fill="#141414" />
            <ellipse cx="149" cy="156" rx="3.5" ry="2.5" fill="#3a3535" opacity="0.5" />
            <ellipse cx="155" cy="155" rx="3" ry="2.5" fill="#3a3535" opacity="0.5" />
          </g>

          {/* === TORSO === */}
          <path d="M68 110c-8 18-6 50 6 64 10 14 36 16 52 4 14-12 18-44 10-66-6-16-22-24-36-24s-26 6-32 22z" fill="#1b1b1b" />
          {/* Belly */}
          <ellipse cx="100" cy="140" rx="30" ry="34" fill="url(#belly-grad)" />
          {/* Belly highlight */}
          <ellipse cx="94" cy="130" rx="12" ry="10" fill="#fff" opacity="0.35" />

          {/* === HEAD === */}
          <g className="bek-head" style={{ transform: `rotate(${look}deg)` }}>
            {/* Ears */}
            <g className="bek-ear bek-ear-l">
              <ellipse cx="62" cy="62" rx="19" ry="19" fill="#1a1a1a" />
              <ellipse cx="62" cy="64" rx="10" ry="10" fill="#3a3a3a" />
              {/* Inner ear pink */}
              <ellipse cx="62" cy="65" rx="6" ry="6" fill="#c9827a" opacity="0.35" />
            </g>
            <g className="bek-ear bek-ear-r">
              <ellipse cx="138" cy="62" rx="19" ry="19" fill="#1a1a1a" />
              <ellipse cx="138" cy="64" rx="10" ry="10" fill="#3a3a3a" />
              <ellipse cx="138" cy="65" rx="6" ry="6" fill="#c9827a" opacity="0.35" />
            </g>

            {/* Head shape */}
            <ellipse cx="100" cy="88" rx="50" ry="46" fill="url(#face-grad)" />

            {/* Eye patches */}
            <ellipse cx="76" cy="92" rx="18" ry="20" fill="#1c1c1c" transform="rotate(-8, 76, 92)" />
            <ellipse cx="124" cy="92" rx="18" ry="20" fill="#1c1c1c" transform="rotate(8, 124, 92)" />

            {/* Eyes */}
            <g className="bek-eye bek-eye-l">
              <ellipse cx="76" cy="92" rx="9" ry="10" fill="#fff" />
              <ellipse className="bek-pupil" cx="77" cy="94" rx="5" ry="5.5" fill="#2b2118" />
              <circle cx="74.5" cy="90.5" r="2" fill="#fff" />
              <circle cx="79" cy="93" r="1" fill="#fff" opacity="0.6" />
            </g>
            <g className="bek-eye bek-eye-r">
              <ellipse cx="124" cy="92" rx="9" ry="10" fill="#fff" />
              <ellipse className="bek-pupil" cx="125" cy="94" rx="5" ry="5.5" fill="#2b2118" />
              <circle cx="122.5" cy="90.5" r="2" fill="#fff" />
              <circle cx="127" cy="93" r="1" fill="#fff" opacity="0.6" />
            </g>

            {/* Eyebrows */}
            <g className="bek-brows">
              <path d={browL} fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
              <path d={browR} fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Nose */}
            <ellipse cx="100" cy="106" rx="6" ry="4" fill="#1c1c1c" />
            {/* Nose highlight */}
            <ellipse cx="98" cy="105" rx="2.5" ry="1.5" fill="#444" opacity="0.5" />

            {/* Mouth */}
            <path className="bek-mouth" d={mouth} fill="none" stroke="#1c1c1c" strokeWidth="1.8" strokeLinecap="round" />

            {/* Tongue (cheer / win only) */}
            {(mood === "cheer" || mood === "win") && (
              <ellipse className="bek-tongue" cx="100" cy="117" rx="4" ry="3" fill="#e87777" opacity="0.8" />
            )}

            {/* Blush cheeks */}
            <g className="bek-blush">
              <ellipse cx="62" cy="104" rx="8" ry="5" fill="#f5a0a0" opacity="0" />
              <ellipse cx="138" cy="104" rx="8" ry="5" fill="#f5a0a0" opacity="0" />
            </g>

            {/* === GRADUATION CAP === */}
            <g className="bek-cap">
              {/* Cap board (mortarboard) */}
              <path d="M50 58l50-14 50 14-50 14z" fill="url(#cap-board)" />
              {/* Board edge highlight */}
              <path d="M50 58l50 14 50-14" fill="none" stroke="#333" strokeWidth="1" opacity="0.4" />
              {/* Cap base (skull cap) */}
              <path d="M66 62c0-4 15-10 34-10s34 6 34 10v10c0 4-15 6-34 6s-34-2-34-6z" fill="url(#cap-grad)" />
              {/* Cap base highlight */}
              <ellipse cx="100" cy="63" rx="24" ry="4" fill="#3a3a3a" opacity="0.4" />
              {/* Button on top */}
              <circle cx="100" cy="44" r="3.5" fill="#e4c36a" />
              <circle cx="99" cy="43" r="1.2" fill="#f0d88a" opacity="0.7" />
              {/* Tassel */}
              <g className="bek-tassel">
                <path d="M100 47c12 4 20 14 18 26" fill="none" stroke="#e4c36a" strokeWidth="2.2" strokeLinecap="round" />
                {/* Tassel end */}
                <g className="bek-tassel-end">
                  <path d="M116 73c1 3 0 6-2 8s-5 2-6 0c-1-3 0-6 2-8s5-2 6 0z" fill="#e4c36a" />
                  <path d="M114 76c0 2-1 4-2 5" fill="none" stroke="#d4b35a" strokeWidth="1" opacity="0.6" />
                  <line x1="114" y1="81" x2="112" y2="87" stroke="#e4c36a" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="116" y1="81" x2="116" y2="87" stroke="#e4c36a" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="118" y1="80" x2="120" y2="86" stroke="#e4c36a" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* === WIN SPARKLES === */}
        {mood === "win" && (
          <g className="bek-sparkles" filter="url(#panda-glow)">
            <polygon className="bek-spark bek-spark-1" points="30,40 33,36 36,40 33,44" fill="#f6d365" />
            <polygon className="bek-spark bek-spark-2" points="168,50 171,46 174,50 171,54" fill="#f6d365" />
            <polygon className="bek-spark bek-spark-3" points="46,28 49,24 52,28 49,32" fill="#fda085" />
            <polygon className="bek-spark bek-spark-4" points="152,30 155,26 158,30 155,34" fill="#fda085" />
            <circle className="bek-spark bek-spark-5" cx="24" cy="68" r="2.5" fill="#a8edea" />
            <circle className="bek-spark bek-spark-6" cx="176" cy="72" r="2.5" fill="#a8edea" />
            <polygon className="bek-spark bek-spark-7" points="40,12 42,8 44,12 42,16" fill="#f6d365" />
            <polygon className="bek-spark bek-spark-8" points="160,14 162,10 164,14 162,18" fill="#fda085" />
          </g>
        )}

        {/* === CHEER PARTICLES === */}
        {mood === "cheer" && (
          <g className="bek-cheer-particles">
            <circle className="bek-particle bek-p1" cx="36" cy="50" r="2" fill="#6dd5c8" />
            <circle className="bek-particle bek-p2" cx="164" cy="46" r="2" fill="#6dd5c8" />
            <circle className="bek-particle bek-p3" cx="44" cy="34" r="1.5" fill="#f6d365" />
            <circle className="bek-particle bek-p4" cx="156" cy="38" r="1.5" fill="#f6d365" />
          </g>
        )}
      </svg>
    </span>
  );
}
