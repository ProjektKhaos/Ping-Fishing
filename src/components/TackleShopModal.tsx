/**
 * TackleShopModal - Chiang Mai Riverside Tackle & Gear Upgrades
 */

import React, { useState } from 'react';
import { TackleGear } from '../game/types';
import { GEAR_UPGRADES } from '../game/fishData';
import { X, Check, ShoppingBag, ShieldCheck, Zap, Anchor, Sparkles } from 'lucide-react';

interface TackleShopModalProps {
  coins: number;
  gear: TackleGear;
  onBuyUpgrade: (type: 'rod' | 'line' | 'sinker' | 'bait', tier: number) => boolean;
  onClose: () => void;
}

export const TackleShopModal: React.FC<TackleShopModalProps> = ({
  coins,
  gear,
  onBuyUpgrade,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rods' | 'lines' | 'sinkers' | 'baits'>('rods');

  return (
    <div className="absolute inset-0 bg-stone-950/85 z-40 flex items-center justify-center p-4 select-none">
      <div className="max-w-2xl w-full bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-stone-100 uppercase tracking-wide">
                Saphan Lek Tackle Outfitter
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                Authentic Northern Thai river tackle & flood heavy rigs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-stone-900 border border-amber-500/40 px-3.5 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-stone-400 font-bold uppercase text-[10px] block">Wallet</span>
              <span className="text-amber-300 font-black text-sm tabular-nums">฿{coins}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-stone-800 bg-stone-950/50 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('rods')}
            className={`py-3 flex items-center justify-center gap-2 border-b-2 cursor-pointer transition ${
              activeTab === 'rods' ? 'border-amber-500 text-amber-400 bg-stone-900' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap size={14} />
            RODS
          </button>
          <button
            onClick={() => setActiveTab('lines')}
            className={`py-3 flex items-center justify-center gap-2 border-b-2 cursor-pointer transition ${
              activeTab === 'lines' ? 'border-amber-500 text-amber-400 bg-stone-900' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck size={14} />
            LINES
          </button>
          <button
            onClick={() => setActiveTab('sinkers')}
            className={`py-3 flex items-center justify-center gap-2 border-b-2 cursor-pointer transition ${
              activeTab === 'sinkers' ? 'border-amber-500 text-amber-400 bg-stone-900' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Anchor size={14} />
            SINKERS
          </button>
          <button
            onClick={() => setActiveTab('baits')}
            className={`py-3 flex items-center justify-center gap-2 border-b-2 cursor-pointer transition ${
              activeTab === 'baits' ? 'border-amber-500 text-amber-400 bg-stone-900' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles size={14} />
            BAITS
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'rods' &&
            GEAR_UPGRADES.rods.map((rod) => {
              const isEquipped = gear.rodTier === rod.tier;
              const canAfford = coins >= rod.price;
              return (
                <div
                  key={rod.tier}
                  className={`p-4 rounded-xl border flex items-center justify-between transition ${
                    isEquipped
                      ? 'bg-amber-950/20 border-amber-500/60'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-100">{rod.name}</span>
                      {isEquipped && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">{rod.description}</p>
                    <div className="text-[11px] font-mono text-amber-400/90">
                      Reel Speed: {rod.reelSpeed}x · Max Flex Buffer: +{rod.maxTensionBuffer}
                    </div>
                  </div>

                  {isEquipped ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                      <Check size={16} /> ACTIVE
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuyUpgrade('rod', rod.tier)}
                      disabled={!canAfford}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono cursor-pointer transition ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {rod.price === 0 ? 'Equip' : `฿${rod.price}`}
                    </button>
                  )}
                </div>
              );
            })}

          {activeTab === 'lines' &&
            GEAR_UPGRADES.lines.map((line) => {
              const isEquipped = gear.lineTier === line.tier;
              const canAfford = coins >= line.price;
              return (
                <div
                  key={line.tier}
                  className={`p-4 rounded-xl border flex items-center justify-between transition ${
                    isEquipped
                      ? 'bg-amber-950/20 border-amber-500/60'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-100">{line.name}</span>
                      {isEquipped && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">{line.description}</p>
                    <div className="text-[11px] font-mono text-amber-400/90">
                      Snap Tension Margin: {line.snapMargin}x
                    </div>
                  </div>

                  {isEquipped ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                      <Check size={16} /> ACTIVE
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuyUpgrade('line', line.tier)}
                      disabled={!canAfford}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono cursor-pointer transition ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {line.price === 0 ? 'Equip' : `฿${line.price}`}
                    </button>
                  )}
                </div>
              );
            })}

          {activeTab === 'sinkers' &&
            GEAR_UPGRADES.sinkers.map((sinker) => {
              const isEquipped = gear.sinkerTier === sinker.tier;
              const canAfford = coins >= sinker.price;
              return (
                <div
                  key={sinker.tier}
                  className={`p-4 rounded-xl border flex items-center justify-between transition ${
                    isEquipped
                      ? 'bg-amber-950/20 border-amber-500/60'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-100">{sinker.name}</span>
                      {isEquipped && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">{sinker.description}</p>
                    <div className="text-[11px] font-mono text-amber-400/90">
                      Flood Torrent Resistance: {sinker.driftDamping}x · Cast Distance Bonus: +{sinker.castBonus}m
                    </div>
                  </div>

                  {isEquipped ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                      <Check size={16} /> ACTIVE
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuyUpgrade('sinker', sinker.tier)}
                      disabled={!canAfford}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono cursor-pointer transition ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {sinker.price === 0 ? 'Equip' : `฿${sinker.price}`}
                    </button>
                  )}
                </div>
              );
            })}

          {activeTab === 'baits' &&
            GEAR_UPGRADES.baits.map((bait) => {
              const isEquipped = gear.baitTier === bait.tier;
              const canAfford = coins >= bait.price;
              return (
                <div
                  key={bait.tier}
                  className={`p-4 rounded-xl border flex items-center justify-between transition ${
                    isEquipped
                      ? 'bg-amber-950/20 border-amber-500/60'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-100">{bait.name}</span>
                      {isEquipped && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">{bait.description}</p>
                    <div className="text-[11px] font-mono text-amber-400/90">
                      Rare / Trophy Fish Lure Bonus: +{Math.round(bait.rareChanceBonus * 100)}%
                    </div>
                  </div>

                  {isEquipped ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                      <Check size={16} /> ACTIVE
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuyUpgrade('bait', bait.tier)}
                      disabled={!canAfford}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono cursor-pointer transition ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {bait.price === 0 ? 'Equip' : `฿${bait.price}`}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
