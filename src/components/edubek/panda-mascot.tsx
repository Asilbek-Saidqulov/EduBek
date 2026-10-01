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

  React.useEffect(() => {
    let a = 0;
    let b = 0;
    let alive = true;
    const blinkSoon = () => {
      a = window.setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        window.setTimeout(() => alive && setBlink(false), 130);
        blinkSoon();
      }, 1900 + Math.random() * 2400);
    };
    const lookSoon = () => {
      b = window.setTimeout(() => {
        if (!alive) return;
        setLook((Math.random() - 0.5) * 7);
        lookSoon();
      }, 1600 + Math.random() * 1800);
    };
    blinkSoon();
    lookSoon();
    return () => {
      alive = false;
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  return (
    <span
      className={`bek-panda panda-${mood} ${hanging ? "is-hanging" : ""} ${walking ? "is-walking" : ""} ${blink ? "is-blink" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {note ? <span className="panda-bubble">{note}</span> : null}
      <svg viewBox="0 0 200 230" className="bek-panda-svg">
        <ellipse className="bek-shadow" cx="100" cy="214" rx="42" ry="8" fill="rgb(15 23 42 / 0.16)" />
        <g className="bek-body">
          <g className="bek-leg bek-leg-l">
            <path d="M78 150c-8 8-10 28-6 40 2 6 10 8 16 4 6-8 8-28 2-40-4-6-8-8-12-4z" fill="#1a1a1a" />
            <ellipse cx="82" cy="190" rx="12" ry="7" fill="#111" />
          </g>
          <g className="bek-leg bek-leg-r">
            <path d="M122 150c8 8 10 28 6 40-2 6-10 8-16 4-6-8-8-28-2-40 4-6 8-8 12-4z" fill="#1a1a1a" />
            <ellipse cx="118" cy="190" rx="12" ry="7" fill="#111" />
          </g>
          <g className="bek-arm bek-arm-l">
            <path d="M62 112c-16 6-24 28-18 42 4 8 14 8 18 2 6-12 8-28 4-38-2-6-2-8-4-6z" fill="#1c1c1c" />
            <ellipse cx="50" cy="152" rx="11" ry="8" fill="#111" />
          </g>
          <g className="bek-arm bek-arm-r">
            <path d="M138 112c16 6 24 28 18 42-4 8-14 8-18 2-6-12-8-28-4-38 2-6 2-8 4-6z" fill="#1c1c1c" />
            <ellipse cx="150" cy="152" rx="11" ry="8" fill="#111" />
          </g>
          <path d="M70 108c-6 18-4 48 8 62 10 12 34 14 48 2 16-14 18-44 10-64-8-16-24-22-33-22s-27 6-33 22z" fill="#1b1b1b" />
          <ellipse cx="100" cy="132" rx="28" ry="30" fill="#f7f7f7" />
          <ellipse cx="92" cy="124" rx="10" ry="8" fill="#fff" opacity="0.7" />
          <g className="bek-head" style={{ transform: `rotate(${look}deg)` }}>
            <ellipse className="bek-ear bek-ear-l" cx="62" cy="62" rx="18" ry="18" fill="#1a1a1a" />
            <ellipse className="bek-ear bek-ear-r" cx="138" cy="62" rx="18" ry="18" fill="#1a1a1a" />
            <ellipse cx="62" cy="64" rx="9" ry="9" fill="#3a3a3a" />
            <ellipse cx="138" cy="64" rx="9" ry="9" fill="#3a3a3a" />
            <ellipse cx="100" cy="86" rx="48" ry="44" fill="#fbfbfb" />
            <ellipse cx="78" cy="90" rx="16" ry="18" fill="#1c1c1c" />
            <ellipse cx="122" cy="90" rx="16" ry="18" fill="#1c1c1c" />
            <g className="bek-eye bek-eye-l">
              <ellipse cx="78" cy="90" rx="8" ry="9" fill="#fff" />
              <ellipse cx="79" cy="92" rx="4.2" ry="4.6" fill="#2b2118" />
              <circle cx="77.2" cy="90.2" r="1.4" fill="#fff" />
            </g>
            <g className="bek-eye bek-eye-r">
              <ellipse cx="122" cy="90" rx="8" ry="9" fill="#fff" />
              <ellipse cx="123" cy="92" rx="4.2" ry="4.6" fill="#2b2118" />
              <circle cx="121.2" cy="90.2" r="1.4" fill="#fff" />
            </g>
            <ellipse cx="100" cy="104" rx="5" ry="3.4" fill="#1c1c1c" />
            <path d="M92 110c4 5 12 5 16 0" fill="none" stroke="#1c1c1c" strokeWidth="1.6" strokeLinecap="round" />
            <g className="bek-cap">
              <path d="M58 58h84l-8 10H66z" fill="#1a1a1a" />
              <path d="M46 66h108l-10 8H56z" fill="#111" />
              <circle cx="128" cy="62" r="3" fill="#e4c36a" />
              <g className="bek-tassel">
                <path d="M128 64c10 2 16 10 14 18" fill="none" stroke="#e4c36a" strokeWidth="2" strokeLinecap="round" />
                <path d="M140 82c2 6-2 10-6 10s-6-3-4-8" fill="#e4c36a" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}
