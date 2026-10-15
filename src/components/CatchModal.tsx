/**
 * CatchModal - Victory celebration card for reeled-in fish and flood relics.
 */

import React from 'react';
import { FishSpecies } from '../game/types';
import { Trophy, Sparkles, Award } from 'lucide-react';

interface CatchModalProps {
  catchData: {
    species: FishSpecies;
    weightKg: number;
    lengthCm: number;
    coinsEarned: number;
    isNewRecord: boolean;
  };
  onDismiss: () => void;
}

export const CatchModal: React.FC<CatchModalProps> = ({ catchData, onDismiss }) => {
  const { species, weightKg, lengthCm, coinsEarned, isNewRecord } = catchData;

  const rarityColors: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    common: { border: 'border-stone-500', bg: 'bg-stone-900/95', text: 'text-stone-300', badge: 'bg-stone-700 text-stone-200' },
    uncommon: { border: 'border-emerald-500', bg: 'bg-emerald-950/95', text: 'text-emerald-300', badge: 'bg-emerald-700 text-emerald-100' },
    rare: { border: 'border-blue-500', bg: 'bg-blue-950/95', text: 'text-blue-300', badge: 'bg-blue-700 text-blue-100' },
    epic: { border: 'border-purple-500', bg: 'bg-purple-950/95', text: 'text-purple-300', badge: 'bg-purple-700 text-purple-100' },
    legendary: { border: 'border-amber-400', bg: 'bg-amber-950/95', text: 'text-amber-300', badge: 'bg-amber-600 text-amber-100' },
  };

  const theme = rarityColors[species.rarity] || rarityColors.common;

  return (
    <div className="absolute inset-0 bg-stone-950/80 z-30 flex items-center justify-center p-4 select-none">
      <div className={`max-w-md w-full ${theme.bg} border-2 ${theme.border} rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Tag */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full ${theme.badge}`}>
            {species.rarity} CATCH
          </span>
          {isNewRecord && (
            <span className="flex items-center gap-1 bg-amber-500 text-stone-950 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Trophy size={12} /> NEW RECORD!
            </span>
          )}
        </div>

        {/* Fish Names */}
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
          {species.name}
        </h2>
        <div className="text-amber-300 font-medium text-sm mt-0.5">
          {species.thaiName}
        </div>
        <div className="text-stone-400 text-xs italic font-serif">
          {species.scientificName}
        </div>

        {/* Key Metrics Display */}
        <div className="grid grid-cols-3 gap-3 w-full my-5">
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] uppercase font-mono text-stone-400">Weight</span>
            <span className="text-lg font-black text-amber-300 font-mono tabular-nums">{weightKg} kg</span>
          </div>
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] uppercase font-mono text-stone-400">Length</span>
            <span className="text-lg font-black text-amber-300 font-mono tabular-nums">{lengthCm} cm</span>
          </div>
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] uppercase font-mono text-stone-400">Reward</span>
            <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">+฿{coinsEarned}</span>
          </div>
        </div>

        {/* Description & Chiang Mai lore */}
        <div className="bg-stone-900/70 border border-stone-800/80 rounded-xl p-3 text-left w-full text-xs text-stone-300 space-y-1.5 mb-5">
          <p>{species.description}</p>
          <div className="pt-1.5 border-t border-stone-800 text-[11px] text-amber-200/90 italic flex items-start gap-1.5">
            <Award size={14} className="shrink-0 text-amber-400 mt-0.5" />
            <span>{species.funFact}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onDismiss}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-stone-950 font-black text-base uppercase tracking-wider rounded-xl shadow-lg border border-amber-300 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles size={18} />
          STORE CATCH & CONTINUE (SPACE)
        </button>
      </div>
    </div>
  );
};
