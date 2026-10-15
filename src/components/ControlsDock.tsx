/**
 * ControlsDock - Ergonomic Collapsible Bottom Control Dock
 * Follows Three.js skill standards: pinned bottom-center, zero side clutter,
 * collapsible for full unobstructed 3D viewing.
 */

import React, { useState } from 'react';
import { Camera, Volume2, VolumeX, ShoppingBag, Compass, ChevronDown, ChevronUp, RefreshCw, Download } from 'lucide-react';

interface ControlsDockProps {
  cameraMode: 'angler' | 'side' | 'bridge';
  onChangeCamera: (mode: 'angler' | 'side' | 'bridge') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenShop: () => void;
  onOpenGuide: () => void;
  onOpenDownload: () => void;
  onResetGame: () => void;
}

export const ControlsDock: React.FC<ControlsDockProps> = ({
  cameraMode,
  onChangeCamera,
  isMuted,
  onToggleMute,
  onOpenShop,
  onOpenGuide,
  onOpenDownload,
  onResetGame,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="fixed z-20 transition-all duration-300 ease-out select-none"
      style={{
        bottom: isCollapsed ? '-64px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'min(940px, 94vw)',
      }}
    >
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center -mb-[1px]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-700/80 border-b-0 px-4 py-1 rounded-t-xl text-[11px] font-mono font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-md cursor-pointer transition"
        >
          {isCollapsed ? (
            <>
              <ChevronUp size={14} className="text-amber-400" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} className="text-amber-400" />
              <span>Cinema Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-stone-950/90 border border-stone-700/80 rounded-2xl p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Camera Angles */}
        <div className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-xl border border-stone-800">
          <span className="text-[10px] text-stone-400 px-2 font-bold flex items-center gap-1">
            <Camera size={12} className="text-amber-400" /> CAM:
          </span>
          <button
            onClick={() => onChangeCamera('angler')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              cameraMode === 'angler' ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:text-white'
            }`}
          >
            Angler
          </button>
          <button
            onClick={() => onChangeCamera('side')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              cameraMode === 'side' ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:text-white'
            }`}
          >
            Bank
          </button>
          <button
            onClick={() => onChangeCamera('bridge')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              cameraMode === 'bridge' ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:text-white'
            }`}
          >
            Bridge
          </button>
        </div>

        {/* Action Hub Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShop}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-amber-600/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
          >
            <ShoppingBag size={14} />
            Shop
          </button>
          <button
            onClick={onOpenGuide}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-amber-600/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
          >
            <Compass size={14} />
            Guide
          </button>
          <button
            onClick={onOpenDownload}
            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
            title="Ladda ner & Installera spelet"
          >
            <Download size={14} />
            Ladda ner
          </button>

          {/* Audio Mute */}
          <button
            onClick={onToggleMute}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 rounded-xl cursor-pointer transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Reset button */}
          <button
            onClick={onResetGame}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 rounded-xl cursor-pointer transition"
            title="Reset Game"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
