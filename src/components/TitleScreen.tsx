/**
 * Title Screen for Ping Flood Angler 3D
 * Live-world 3D camera pan over the flooded Ping River and Chiang Mai Iron Bridge,
 * inline bespoke SVG title lockup, Start CTA, and control hint line.
 */

import React from 'react';
import { Volume2, VolumeX, Compass, ShoppingBag, Download } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  onOpenShop: () => void;
  onOpenGuide: () => void;
  onOpenDownload: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  coins: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenShop,
  onOpenGuide,
  onOpenDownload,
  isMuted,
  onToggleMute,
  coins,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 select-none z-20">
      {/* Top Header Cluster */}
      <div className="flex items-center justify-between w-full">
        {/* Location Badge */}
        <div className="flex items-center gap-3 bg-stone-900/85 text-amber-100 border border-amber-600/30 px-4 py-2 rounded-lg pointer-events-auto shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-none" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold font-mono">Location</span>
            <span className="text-sm font-semibold tracking-wide">Saphan Lek (Iron Bridge) · Ping River, Chiang Mai</span>
          </div>
        </div>

        {/* Quick Actions (Audio / Currency) */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-stone-900/85 text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-lg shadow-lg">
            <span className="text-xs font-mono font-bold uppercase text-stone-400">Wallet:</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-300">฿{coins}</span>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2.5 bg-stone-900/85 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-700 rounded-lg shadow transition cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Center Title Lockup over negative space */}
      <div className="flex flex-col items-center text-center my-auto pointer-events-auto">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="max-w-xl w-full flex flex-col items-center">
          <svg
            viewBox="0 0 640 130"
            className="w-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)] filter"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffeb3b" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="mudGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>

            {/* Bridge Truss Silhouette Motif */}
            <path
              d="M 40 45 L 80 15 L 120 45 L 160 15 L 200 45 L 240 15 L 280 45 L 320 15 L 360 45 L 400 15 L 440 45 L 480 15 L 520 45 L 560 15 L 600 45"
              stroke="#d97706"
              strokeWidth="2.5"
              fill="none"
              opacity="0.4"
            />
            <line x1="40" y1="45" x2="600" y2="45" stroke="#d97706" strokeWidth="3" opacity="0.4" />

            {/* Sub-label Thai */}
            <text
              x="320"
              y="38"
              textAnchor="middle"
              fill="#fef3c7"
              fontSize="16"
              fontWeight="bold"
              letterSpacing="6"
              fontFamily="sans-serif"
            >
              ตกปลาน้ำท่วมสะพานเหล็ก เชียงใหม่
            </text>

            {/* Main Title Wordmark */}
            <text
              x="320"
              y="94"
              textAnchor="middle"
              fill="url(#goldGrad)"
              stroke="#261205"
              strokeWidth="5"
              paintOrder="stroke fill"
              fontSize="52"
              fontWeight="900"
              letterSpacing="3"
              fontFamily="Impact, sans-serif"
            >
              PING FLOOD ANGLER
            </text>

            {/* English Subtitle banner */}
            <text
              x="320"
              y="120"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="14"
              fontWeight="800"
              letterSpacing="8"
              fontFamily="sans-serif"
            >
              CHIANG MAI RIVER RUSH 3D
            </text>
          </svg>

          <p className="mt-2 text-stone-200 text-sm md:text-base font-medium max-w-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            The Ping River is swollen with monsoon torrents! Grab your Ashino rod, battle leaping river monsters, and conquer the surging floodwaters.
          </p>

          {/* Primary Start CTA Button */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onStart}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black text-lg tracking-wider uppercase rounded-xl shadow-[0_4px_24px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer flex items-center gap-3 border border-amber-300"
            >
              <span className="w-3 h-3 rounded-full bg-stone-900 animate-ping" />
              CAST YOUR LINE (START)
            </button>
          </div>

          {/* Secondary Hub Buttons */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onOpenShop}
              className="px-4 py-2 bg-stone-900/85 hover:bg-stone-800 text-amber-300 border border-amber-600/40 rounded-lg text-xs font-bold tracking-wide uppercase flex items-center gap-2 cursor-pointer shadow transition"
            >
              <ShoppingBag size={14} />
              Tackle Shop
            </button>
            <button
              onClick={onOpenGuide}
              className="px-4 py-2 bg-stone-900/85 hover:bg-stone-800 text-amber-300 border border-amber-600/40 rounded-lg text-xs font-bold tracking-wide uppercase flex items-center gap-2 cursor-pointer shadow transition"
            >
              <Compass size={14} />
              Ping Field Guide
            </button>
            <button
              onClick={onOpenDownload}
              className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-bold tracking-wide uppercase flex items-center gap-2 cursor-pointer shadow transition"
            >
              <Download size={14} />
              Ladda ner / App
            </button>
          </div>
        </div>
      </div>

      {/* Control Hint Line */}
      <div className="w-full flex justify-center">
        <div className="bg-stone-950/85 border border-stone-700/60 text-stone-300 px-5 py-2 rounded-full text-xs font-mono font-medium tracking-wide shadow-md">
          <span className="text-amber-400 font-bold">WASD / Arrow Keys</span> Aim Target ·{' '}
          <span className="text-amber-400 font-bold">Space / Click</span> Cast & Reel ·{' '}
          <span className="text-amber-400 font-bold">A/D</span> Counter Pull ·{' '}
          <span className="text-amber-400 font-bold">M</span> Mute ·{' '}
          <span className="text-amber-400 font-bold">Esc</span> Pause
        </div>
      </div>
    </div>
  );
};
