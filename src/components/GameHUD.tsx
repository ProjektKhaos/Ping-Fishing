/**
 * GameHUD - In-Game Status Clusters & Action Prompts
 * World-matched, low-occlusion UI keeping 85%+ of the 3D scene clear.
 */

import React from 'react';
import { GamePhase, PlayerStats } from '../game/types';
import { GEAR_UPGRADES } from '../game/fishData';
import { Zap, Waves, Target, Compass, ShoppingBag } from 'lucide-react';

interface GameHUDProps {
  phase: GamePhase;
  stats: PlayerStats;
  castPower: number;
  biteWindow: number;
  onStartAim: () => void;
  onChargeCast: () => void;
  onReleaseCast: () => void;
  onExecuteStrike: () => void;
  onOpenShop: () => void;
  onOpenGuide: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  phase,
  stats,
  castPower,
  biteWindow,
  onStartAim,
  onChargeCast,
  onReleaseCast,
  onExecuteStrike,
  onOpenShop,
  onOpenGuide,
}) => {
  const rod = GEAR_UPGRADES.rods[stats.gear.rodTier - 1];
  const sinker = GEAR_UPGRADES.sinkers[stats.gear.sinkerTier - 1];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10 select-none">
      {/* Top Status Bar: Perimeter Clusters */}
      <div className="flex items-start justify-between w-full">
        {/* Left: River Conditions & Gear */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* River Conditions */}
          <div className="bg-stone-950/85 border border-stone-800 text-stone-200 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <Waves className="text-amber-500" size={18} />
            <div className="flex flex-col text-xs font-mono">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Ping Flood Velocity</span>
              <span className="text-amber-300 font-bold tabular-nums">4.2 m/s · High Muddy Silt</span>
            </div>
          </div>

          {/* Current Gear Badge */}
          <div className="bg-stone-950/85 border border-stone-800 text-stone-200 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <Target className="text-emerald-400" size={16} />
            <div className="flex flex-col text-xs font-mono">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Equipped Tackle</span>
              <span className="text-stone-100 font-semibold truncate max-w-[170px]">{rod.name}</span>
            </div>
          </div>
        </div>

        {/* Right: Wallet & Navigation */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="bg-stone-950/85 border border-amber-600/30 px-3.5 py-2 rounded-xl shadow-lg flex flex-col items-end text-xs font-mono">
            <span className="text-stone-400 font-bold uppercase text-[10px]">Baht Balance</span>
            <span className="text-amber-300 font-black text-base tabular-nums">฿{stats.coins}</span>
          </div>

          <button
            onClick={onOpenShop}
            className="p-2.5 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-stone-700 rounded-xl shadow transition cursor-pointer"
            title="Tackle Shop"
          >
            <ShoppingBag size={18} />
          </button>

          <button
            onClick={onOpenGuide}
            className="p-2.5 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-stone-700 rounded-xl shadow transition cursor-pointer"
            title="Ping River Compendium"
          >
            <Compass size={18} />
          </button>
        </div>
      </div>

      {/* Center Action Overlay based on Phase */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto">
        {/* Phase: IDLE */}
        {phase === 'idle' && (
          <button
            onClick={onStartAim}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-lg tracking-wider uppercase rounded-2xl shadow-[0_4px_24px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer border border-amber-300 flex items-center gap-3"
          >
            <Target size={22} />
            AIM & CAST LINE
          </button>
        )}

        {/* Phase: AIMING */}
        {phase === 'aiming' && (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-stone-950/90 border border-amber-500/50 px-5 py-2.5 rounded-xl shadow-2xl text-center">
              <div className="text-amber-400 text-xs font-mono uppercase tracking-wider font-bold">Cast Target Position</div>
              <div className="text-stone-200 text-sm font-semibold">Position crosshair over river currents with WASD</div>
            </div>

            <button
              onMouseDown={onChargeCast}
              onTouchStart={onChargeCast}
              onMouseUp={onReleaseCast}
              onTouchEnd={onReleaseCast}
              className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-base uppercase rounded-xl shadow-lg border border-amber-300 cursor-pointer"
            >
              HOLD SPACE OR CLICK TO CHARGE POWER
            </button>
          </div>
        )}

        {/* Phase: CASTING (Power Meter) */}
        {phase === 'casting' && (
          <div className="flex flex-col items-center gap-2 bg-stone-950/90 border border-amber-500/60 p-4 rounded-2xl shadow-2xl w-72">
            <div className="flex items-center justify-between w-full text-xs font-mono">
              <span className="text-amber-400 font-bold uppercase">Cast Power</span>
              <span className="text-amber-300 font-black tabular-nums">{Math.round(castPower * 100)}%</span>
            </div>

            {/* Power meter */}
            <div className="w-full h-5 bg-stone-800 rounded-full overflow-hidden p-1 border border-stone-600">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-75"
                style={{ width: `${castPower * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-stone-300 font-mono">Release Space / Click to Cast!</div>
          </div>
        )}

        {/* Phase: WAITING */}
        {phase === 'waiting' && (
          <div className="bg-stone-950/85 border border-stone-700/80 px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-3 text-stone-300 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>Float drifting in flood current... Watch for bites!</span>
          </div>
        )}

        {/* Phase: BITE (Strike Reaction Window!) */}
        {phase === 'bite' && (
          <div className="flex flex-col items-center gap-3 animate-bounce">
            <button
              onClick={onExecuteStrike}
              className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-2xl tracking-wider uppercase rounded-2xl shadow-[0_0_35px_rgba(239,68,68,0.8)] border-2 border-yellow-300 cursor-pointer active:scale-95 transition-transform flex items-center gap-3"
            >
              <Zap size={28} className="text-yellow-300 animate-pulse" />
              STRIKE NOW! [SPACE]
            </button>
            <div className="text-yellow-300 font-mono text-xs font-bold bg-stone-950/90 px-3 py-1 rounded-full border border-yellow-500">
              Quick! Reaction window: {biteWindow.toFixed(1)}s
            </div>
          </div>
        )}

        {/* Phase: SNAPPED */}
        {phase === 'snapped' && (
          <div className="bg-red-950/95 border-2 border-red-500 text-red-200 px-6 py-4 rounded-2xl shadow-2xl text-center max-w-sm">
            <div className="text-xl font-black uppercase tracking-wide text-red-400">LINE SNAPPED!</div>
            <p className="text-xs text-stone-300 mt-1">
              The river monster surged too hard into the Ping rapids! Upgrade your line in the Tackle Shop to handle heavy tension.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="flex justify-center w-full">
        <div className="bg-stone-950/75 border border-stone-800 text-stone-400 px-4 py-1.5 rounded-full text-xs font-mono shadow">
          {phase === 'aiming' && 'Use WASD to aim landing zone · Space to cast'}
          {phase === 'waiting' && 'Current drifting right · Ready your reflexes!'}
          {phase === 'idle' && 'Click Aim & Cast or Press Space to start fishing'}
          {phase === 'bite' && 'HOOK IT! Press Space or Click immediately!'}
        </div>
      </div>
    </div>
  );
};
