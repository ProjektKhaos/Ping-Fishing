/**
 * FightOverlay - Dynamic Action Fishing HUD
 * Displays line tension meter, fish stamina, distance to shore, and live tactical prompts.
 */

import React from 'react';
import { FightState } from '../game/types';
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

interface FightOverlayProps {
  fight: FightState;
  isMouseDown: boolean;
  onPullLeft: () => void;
  onPullRight: () => void;
  onSlack: () => void;
}

export const FightOverlay: React.FC<FightOverlayProps> = ({
  fight,
}) => {
  const tension = Math.min(100, Math.max(0, fight.lineTension));
  const staminaPercent = Math.round((fight.fishStamina / fight.fishMaxStamina) * 100);
  const dist = fight.lineDistance.toFixed(1);

  // Tension color calculation
  let tensionColor = 'bg-emerald-500';
  let tensionText = 'text-emerald-400';
  let isDanger = false;
  if (tension > 85) {
    tensionColor = 'bg-red-500';
    tensionText = 'text-red-400';
    isDanger = true;
  } else if (tension > 60) {
    tensionColor = 'bg-amber-500';
    tensionText = 'text-amber-400';
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 md:p-6 z-10 select-none">
      {/* Top Center: Fight Status Bar & Tactical Prompt */}
      <div className="flex flex-col items-center gap-2 max-w-xl w-full">
        {/* Dynamic Action Prompt Banner */}
        <div
          className={`px-5 py-2 rounded-xl border text-center shadow-2xl transition-all duration-150 ${
            fight.fishAction === 'thrashing'
              ? 'bg-red-950/90 border-red-500 text-red-200'
              : fight.fishAction === 'running_downstream'
              ? 'bg-amber-950/90 border-amber-500 text-amber-200'
              : 'bg-stone-950/90 border-stone-700 text-stone-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider">
            {fight.isLeaping && <span className="text-yellow-300 font-bold">★ SURFACE LEAP! ★</span>}
            <span>Species: {fight.fish.name} ({fight.fishWeightKg} kg)</span>
          </div>

          <div className="text-base md:text-lg font-black tracking-wide flex items-center justify-center gap-2 mt-0.5">
            {fight.recommendedPull === 'slack' && (
              <>
                <ArrowDown className="text-yellow-400 animate-bounce" size={20} />
                <span className="text-yellow-300">LEAPING! SLACK LINE [S / Release Reel]</span>
              </>
            )}
            {fight.recommendedPull === 'left' && (
              <>
                <ArrowLeft className="text-amber-400 animate-pulse" size={20} />
                <span className="text-amber-300">SURGING WITH CURRENT! COUNTER-PULL LEFT [A]</span>
              </>
            )}
            {fight.recommendedPull === 'right' && (
              <>
                <span className="text-amber-300">DARTING UPSTREAM! COUNTER-PULL RIGHT [D]</span>
                <ArrowRight className="text-amber-400 animate-pulse" size={20} />
              </>
            )}
            {fight.recommendedPull === 'center' && (
              <span className="text-emerald-300">FISH TIRING! REEL IN HARD [SPACE / CLICK]</span>
            )}
          </div>
        </div>

        {/* Tension Gauge & Distance readout */}
        <div className="w-full bg-stone-950/85 border border-stone-700/80 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-stone-400 flex items-center gap-1 font-bold">
              {isDanger && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
              LINE TENSION:
            </span>
            <span className={`font-black tabular-nums ${tensionText}`}>{Math.round(tension)}%</span>
          </div>

          {/* Tension meter bar */}
          <div className="w-full h-3.5 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-600">
            <div
              className={`h-full rounded-full transition-all duration-75 ${tensionColor}`}
              style={{ width: `${tension}%` }}
            />
          </div>

          {/* Dual Metrics: Distance & Stamina */}
          <div className="grid grid-cols-2 gap-4 mt-2.5 pt-2 border-t border-stone-800/80 text-xs font-mono">
            <div>
              <div className="text-stone-400 uppercase tracking-wider text-[10px]">Distance to Shore</div>
              <div className="text-base font-bold tabular-nums text-amber-300">{dist} m</div>
            </div>
            <div>
              <div className="text-stone-400 uppercase tracking-wider text-[10px]">Fish Stamina</div>
              <div className="text-base font-bold tabular-nums text-sky-400">{staminaPercent}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="bg-stone-950/80 text-stone-300 px-4 py-1.5 rounded-full text-xs font-mono border border-stone-800 shadow">
        Hold <span className="text-amber-400 font-bold">SPACE</span> or <span className="text-amber-400 font-bold">CLICK</span> to Reel · Steer with <span className="text-amber-400 font-bold">A/D</span>
      </div>
    </div>
  );
};
