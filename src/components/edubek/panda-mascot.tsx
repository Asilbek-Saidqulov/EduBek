"use client";

import * as React from "react";
import "./panda-mascot.css";

export type PandaMood = "idle" | "cheer" | "worry" | "win";

/**
 * Brand panda. The sprite is the supplied art; motion is layered on top
 * so it breathes, blinks, and looks around instead of sitting still.
 */
export function PandaMascot({
  size = 120,
  mood = "idle",
  className = "",
  hanging = false,
  note,
}: {
  size?: number;
  mood?: PandaMood;
  className?: string;
  hanging?: boolean;
  note?: string;
}) {
  const [blink, setBlink] = React.useState(false);
  const [gaze, setGaze] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    let blinkTimer = 0;
    let gazeTimer = 0;
    let alive = true;

    const scheduleBlink = () => {
      const wait = 2200 + Math.random() * 2800;
      blinkTimer = window.setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        window.setTimeout(() => {
          if (!alive) return;
          setBlink(false);
          if (Math.random() < 0.25) {
            window.setTimeout(() => setBlink(true), 140);
            window.setTimeout(() => setBlink(false), 260);
          }
          scheduleBlink();
        }, 110);
      }, wait);
    };

    const scheduleGaze = () => {
      const wait = 1600 + Math.random() * 2200;
      gazeTimer = window.setTimeout(() => {
        if (!alive) return;
        setGaze({
          x: (Math.random() - 0.5) * 3.2,
          y: (Math.random() - 0.5) * 1.6,
        });
        scheduleGaze();
      }, wait);
    };

    scheduleBlink();
    scheduleGaze();
    return () => {
      alive = false;
      window.clearTimeout(blinkTimer);
      window.clearTimeout(gazeTimer);
    };
  }, []);

  return (
    <span
      className={`panda-stage panda-${mood} ${hanging ? "panda-hang" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="panda-shadow" />
      {note ? <span className="panda-bubble">{note}</span> : null}
      <span className="panda-rig">
        <img src="/mascot-panda.png" alt="" className="panda-sprite" draggable={false} />
        <span
          className="panda-pupils"
          style={{ transform: `translate(${gaze.x}px, ${gaze.y}px)` }}
        />
        <span className={`panda-lid panda-lid-l ${blink ? "is-shut" : ""}`} />
        <span className={`panda-lid panda-lid-r ${blink ? "is-shut" : ""}`} />
        <span className="panda-tassel" />
      </span>
    </span>
  );
}
