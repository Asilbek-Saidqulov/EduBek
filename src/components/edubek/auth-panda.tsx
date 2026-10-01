"use client";

import * as React from "react";
import { PandaMascot, type PandaMood } from "@/components/edubek/panda-mascot";

export type AuthPandaMood = PandaMood | "cover";

/**
 * Walks the auth screen and reacts to the field the user is on.
 * cover = paws up while a password is being typed.
 */
export function AuthPanda({
  mood = "idle",
  note = "",
  cover = false,
}: {
  mood?: PandaMood;
  note?: string;
  cover?: boolean;
}) {
  const [pos, setPos] = React.useState({ x: 18, y: 28 });
  const [flip, setFlip] = React.useState(false);
  const target = React.useRef({ x: 18, y: 28, vx: 0.35, vy: 0.22 });

  React.useEffect(() => {
    let frame = 0;
    const tick = () => {
      const t = target.current;
      if (cover || mood === "worry" || mood === "cheer") {
        t.x += (72 - t.x) * 0.04;
        t.y += (38 - t.y) * 0.04;
      } else {
        t.x += t.vx;
        t.y += t.vy;
        if (t.x < 6 || t.x > 82) t.vx *= -1;
        if (t.y < 10 || t.y > 74) t.vy *= -1;
      }
      setFlip(t.vx < 0);
      setPos({ x: t.x, y: t.y });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [cover, mood]);

  return (
    <div
      className="pointer-events-none fixed z-20 hidden md:block"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `translate(-50%, -50%) scaleX(${flip ? -1 : 1})` }}
      aria-hidden
    >
      <div className={cover ? "panda-cover" : ""}>
        <PandaMascot size={128} mood={mood} note={note} />
        {cover ? <span className="panda-paws" /> : null}
      </div>
    </div>
  );
}
