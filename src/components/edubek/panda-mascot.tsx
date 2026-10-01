"use client";

import * as React from "react";
import "./panda-mascot.css";

export type PandaMood = "idle" | "cheer" | "worry" | "win";

export function PandaMascot({
  size = 120,
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
    let blinkTimer = 0;
    let lookTimer = 0;
    let alive = true;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        window.setTimeout(() => {
          if (!alive) return;
          setBlink(false);
          scheduleBlink();
        }, 120);
      }, 1800 + Math.random() * 2600);
    };
    const scheduleLook = () => {
      lookTimer = window.setTimeout(() => {
        if (!alive) return;
        setLook((Math.random() - 0.5) * 10);
        scheduleLook();
      }, 1400 + Math.random() * 1800);
    };
    scheduleBlink();
    scheduleLook();
    return () => {
      alive = false;
      window.clearTimeout(blinkTimer);
      window.clearTimeout(lookTimer);
    };
  }, []);

  return (
    <span
      className={`panda3d panda-${mood} ${hanging ? "panda-hang" : ""} ${walking ? "is-walking" : ""} ${blink ? "is-blink" : ""} ${className}`}
      style={{ width: size, height: size, ["--look" as string]: `${look}deg` }}
      aria-hidden
    >
      {note ? <span className="panda-bubble">{note}</span> : null}
      <span className="panda3d-stage">
        <span className="panda3d-shadow" />
        <span className="panda3d-body">
          <span className="panda3d-leg panda3d-leg-l" />
          <span className="panda3d-leg panda3d-leg-r" />
          <span className="panda3d-torso">
            <span className="panda3d-belly" />
            <span className="panda3d-arm panda3d-arm-l" />
            <span className="panda3d-arm panda3d-arm-r" />
          </span>
          <span className="panda3d-head">
            <span className="panda3d-ear panda3d-ear-l" />
            <span className="panda3d-ear panda3d-ear-r" />
            <span className="panda3d-cap">
              <span className="panda3d-board" />
              <span className="panda3d-tassel" />
            </span>
            <span className="panda3d-face">
              <span className="panda3d-patch panda3d-patch-l" />
              <span className="panda3d-patch panda3d-patch-r" />
              <span className="panda3d-eye panda3d-eye-l"><span /></span>
              <span className="panda3d-eye panda3d-eye-r"><span /></span>
              <span className="panda3d-nose" />
              <span className="panda3d-smile" />
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}
