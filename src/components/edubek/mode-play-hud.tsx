"use client";

import { Castle, Coins, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODE_SKIN, ModeStatusChips, type GameModeType } from "@/components/edubek/game-modes";
import { ModeMascot, type MascotMood } from "@/components/edubek/mode-mascots";

export function ModePlayHud({
  mode,
  gold = 0,
  pendingGold = 0,
  hearts = 3,
  hasShield = false,
  classicPoints = 0,
  empireTier = "Hut",
  wood = 0,
  stone = 0,
  food = 0,
  empireGold = 0,
  battleYou = 0,
  battleThem = 0,
  mood = "idle",
}: {
  mode: GameModeType;
  gold?: number;
  pendingGold?: number;
  hearts?: number;
  hasShield?: boolean;
  classicPoints?: number;
  empireTier?: string;
  wood?: number;
  stone?: number;
  food?: number;
  empireGold?: number;
  battleYou?: number;
  battleThem?: number;
  mood?: MascotMood;
}) {
  const skin = MODE_SKIN[mode];
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${skin.hud}`}>
      <ModeMascot mode={mode} mood={mood} size={56} />
      <div className="flex flex-wrap items-center gap-2">
        <ModeStatusChips
          mode={mode}
          vaultGold={gold}
          hearts={hearts}
          hasShield={hasShield}
          classicPoints={classicPoints}
          empireTier={empireTier}
          battleYou={battleYou}
          battleThem={battleThem}
        />
        {mode === "empire" && (
          <div className="flex gap-2 text-[11px] font-medium opacity-80">
            <span>Wood {wood}</span>
            <span>Stone {stone}</span>
            <span>Gold {empireGold}</span>
            <span>Food {food}</span>
          </div>
        )}
        {mode === "heist" && pendingGold > 0 && (
          <span className="text-[11px] text-amber-200">+{pendingGold} pending</span>
        )}
        {mode === "royale" && hasShield && <Shield className="size-3.5 text-amber-300 mode-float" />}
      </div>
    </div>
  );
}

export function HeistActionBar({
  pendingGold,
  disabled,
  onAction,
}: {
  pendingGold: number;
  disabled?: boolean;
  onAction: (action: "save" | "invest" | "steal") => void;
}) {
  if (pendingGold <= 0) return null;
  return (
    <div className="mode-rise rounded-2xl border border-amber-400/30 bg-amber-950/40 p-3 space-y-2">
      <p className="text-xs text-amber-100 flex items-center gap-1.5">
        <Coins className="size-3.5" />
        Pip found {pendingGold} gold — keep, invest, or raid the pot
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onAction("save")}>
          Save
        </Button>
        <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onAction("invest")}>
          Invest
        </Button>
        <Button size="sm" className="bg-yellow-400 text-zinc-900 hover:bg-yellow-300" disabled={disabled} onClick={() => onAction("steal")}>
          Raid
        </Button>
      </div>
    </div>
  );
}

export function EmpireUpgradeBar({
  canUpgrade,
  disabled,
  onUpgrade,
}: {
  canUpgrade?: boolean;
  disabled?: boolean;
  onUpgrade: () => void;
}) {
  if (!canUpgrade) return null;
  return (
    <Button size="sm" className="mode-rise" disabled={disabled} onClick={onUpgrade}>
      <Castle className="size-3.5" />
      Moss can upgrade
    </Button>
  );
}
