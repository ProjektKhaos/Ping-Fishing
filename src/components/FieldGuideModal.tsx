/**
 * FieldGuideModal - Compendium of Ping River Fish Species & Relics
 */

import React, { useState } from 'react';
import { FISH_SPECIES } from '../game/fishData';
import { FishSpecies } from '../game/types';
import { X, BookOpen, Trophy, Award, HelpCircle } from 'lucide-react';

interface FieldGuideModalProps {
  unlockedCatches: Record<string, { count: number; maxWeight: number }>;
  onClose: () => void;
}

export const FieldGuideModal: React.FC<FieldGuideModalProps> = ({
  unlockedCatches,
  onClose,
}) => {
  const [selectedFish, setSelectedFish] = useState<FishSpecies>(FISH_SPECIES[0]);

  const totalSpecies = FISH_SPECIES.length;
  const caughtCount = Object.keys(unlockedCatches).length;

  return (
    <div className="absolute inset-0 bg-stone-950/85 z-40 flex items-center justify-center p-4 select-none">
      <div className="max-w-3xl w-full bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-stone-100 uppercase tracking-wide">
                Ping River Field Compendium
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                Catalog of wildlife & flooded relics at Chiang Mai's Iron Bridge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-stone-900 border border-amber-500/30 px-3 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-stone-400 font-bold uppercase text-[10px] block">Discovered</span>
              <span className="text-amber-300 font-black tabular-nums">
                {caughtCount} / {totalSpecies} Species
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2-Column layout: Species list on left, detailed dossier on right */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Species List */}
          <div className="md:col-span-5 border-r border-stone-800 overflow-y-auto p-3 space-y-2 bg-stone-950/40">
            {FISH_SPECIES.map((fish) => {
              const record = unlockedCatches[fish.id];
              const isCaught = Boolean(record && record.count > 0);
              const isSelected = selectedFish.id === fish.id;

              return (
                <button
                  key={fish.id}
                  onClick={() => setSelectedFish(fish)}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60'
                      : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-stone-700 shrink-0"
                      style={{ backgroundColor: isCaught ? fish.color : '#333' }}
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-200">
                        {isCaught ? fish.name : '??? (Undiscovered)'}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {isCaught ? `${record.count} caught` : 'Not yet caught'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                      fish.rarity === 'legendary'
                        ? 'bg-amber-600 text-stone-950'
                        : fish.rarity === 'epic'
                        ? 'bg-purple-800 text-purple-100'
                        : fish.rarity === 'rare'
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {fish.rarity}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Dossier */}
          <div className="md:col-span-7 p-5 overflow-y-auto flex flex-col justify-between space-y-4">
            {unlockedCatches[selectedFish.id] ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400">
                    {selectedFish.rarity} Freshwater Specimen
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">{selectedFish.name}</h3>
                  <div className="text-amber-300 font-semibold text-sm">{selectedFish.thaiName}</div>
                  <div className="text-stone-400 text-xs italic">{selectedFish.scientificName}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 uppercase font-mono">Personal Best</span>
                    <div className="text-lg font-black text-amber-300 font-mono tabular-nums flex items-center gap-1.5 mt-0.5">
                      <Trophy size={16} className="text-amber-500" />
                      {unlockedCatches[selectedFish.id].maxWeight} kg
                    </div>
                  </div>
                  <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 uppercase font-mono">Total Landed</span>
                    <div className="text-lg font-black text-emerald-400 font-mono tabular-nums mt-0.5">
                      {unlockedCatches[selectedFish.id].count} times
                    </div>
                  </div>
                </div>

                <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 text-xs text-stone-300 space-y-2">
                  <p className="leading-relaxed">{selectedFish.description}</p>
                  <div className="pt-2 border-t border-stone-800 text-amber-200/90 italic flex items-start gap-2">
                    <Award size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{selectedFish.funFact}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                <div className="p-4 bg-stone-800/50 rounded-full text-stone-500">
                  <HelpCircle size={40} />
                </div>
                <h4 className="text-base font-bold text-stone-300">Specimen Not Yet Recorded</h4>
                <p className="text-xs text-stone-500 max-w-xs font-mono">
                  Cast into the swollen currents of the Ping River with different baits to hook and identify this creature!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
