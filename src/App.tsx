/**
 * Ping Flood Angler 3D - Chiang Mai River Rush
 * Main Application Shell integrating Three.js 3D world with action fishing gameplay.
 */

import React, { useEffect, useRef, useState } from 'react';
import { RiverScene } from './game/three/RiverScene';
import { GameManager } from './game/GameManager';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { FightOverlay } from './components/FightOverlay';
import { CatchModal } from './components/CatchModal';
import { TackleShopModal } from './components/TackleShopModal';
import { FieldGuideModal } from './components/FieldGuideModal';
import { DownloadModal } from './components/DownloadModal';
import { ControlsDock } from './components/ControlsDock';
import { sound } from './game/audio';
import { GamePhase, PlayerStats, FightState } from './game/types';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<GameManager | null>(null);
  const sceneRef = useRef<RiverScene | null>(null);

  // Synced React UI state (updated via throttled callback from GameManager)
  const [phase, setPhase] = useState<GamePhase>('title');
  const [stats, setStats] = useState<PlayerStats>({
    coins: 150,
    reputation: 0,
    totalCatches: 0,
    biggestFishKg: 0,
    gear: { rodTier: 1, lineTier: 1, sinkerTier: 1, baitTier: 1 },
    unlockedCatches: {},
  });
  const [fightState, setFightState] = useState<FightState | null>(null);
  const [castPower, setCastPower] = useState<number>(0);
  const [biteWindow, setBiteWindow] = useState<number>(0);
  const [lastCatch, setLastCatch] = useState<any>(null);
  const [cameraMode, setCameraMode] = useState<'angler' | 'side' | 'bridge'>('angler');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Mount 3D Scene & Game Engine once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new RiverScene(mountRef.current);
    sceneRef.current = scene;

    const manager = new GameManager(scene, (gm) => {
      setPhase(gm.phase);
      setStats({ ...gm.stats });
      setFightState(gm.fight ? { ...gm.fight } : null);
      setCastPower(gm.castPower);
      setBiteWindow(gm.biteReactionWindow);
      setLastCatch(gm.lastCaughtFish);
    });
    managerRef.current = manager;

    return () => {
      manager.destroy();
      scene.destroy();
      managerRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  // Handlers
  const handleStartGame = () => {
    managerRef.current?.startGame();
  };

  const handleStartAim = () => {
    managerRef.current?.startAiming();
  };

  const handleChargeCast = () => {
    managerRef.current?.startChargingCast();
  };

  const handleReleaseCast = () => {
    managerRef.current?.releaseCast();
  };

  const handleExecuteStrike = () => {
    managerRef.current?.executeStrike();
  };

  const handleDismissCatch = () => {
    managerRef.current?.dismissCatchModal();
  };

  const handleBuyUpgrade = (type: 'rod' | 'line' | 'sinker' | 'bait', tier: number) => {
    if (!managerRef.current) return false;
    return managerRef.current.buyUpgrade(type, tier);
  };

  const handleChangeCamera = (mode: 'angler' | 'side' | 'bridge') => {
    setCameraMode(mode);
    if (sceneRef.current) {
      sceneRef.current.cameraViewMode = mode;
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleResetGame = () => {
    if (window.confirm('Reset angler game progress and records?')) {
      localStorage.removeItem('ping_flood_angler_save_v1');
      window.location.reload();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans text-stone-100 select-none">
      {/* 3D Canvas Isolated Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Title Screen Overlay */}
      {phase === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenDownload={() => setIsDownloadOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          coins={stats.coins}
        />
      )}

      {/* Active Game HUD */}
      {phase !== 'title' && phase !== 'fighting' && (
        <GameHUD
          phase={phase}
          stats={stats}
          castPower={castPower}
          biteWindow={biteWindow}
          onStartAim={handleStartAim}
          onChargeCast={handleChargeCast}
          onReleaseCast={handleReleaseCast}
          onExecuteStrike={handleExecuteStrike}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* Fight Minigame Overlay */}
      {phase === 'fighting' && fightState && (
        <FightOverlay
          fight={fightState}
          isMouseDown={Boolean(managerRef.current?.mouseHeld)}
          onPullLeft={() => {}}
          onPullRight={() => {}}
          onSlack={() => {}}
        />
      )}

      {/* Victory Catch Modal */}
      {phase === 'caught' && lastCatch && (
        <CatchModal catchData={lastCatch} onDismiss={handleDismissCatch} />
      )}

      {/* Tackle Shop Modal */}
      {isShopOpen && (
        <TackleShopModal
          coins={stats.coins}
          gear={stats.gear}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Field Guide Modal */}
      {isGuideOpen && (
        <FieldGuideModal
          unlockedCatches={stats.unlockedCatches}
          onClose={() => setIsGuideOpen(false)}
        />
      )}

      {/* Download & Offline Install Modal */}
      {isDownloadOpen && (
        <DownloadModal onClose={() => setIsDownloadOpen(false)} />
      )}

      {/* Bottom Center Ergonomic Control Dock (Consolidated & Collapsible) */}
      <ControlsDock
        cameraMode={cameraMode}
        onChangeCamera={handleChangeCamera}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onResetGame={handleResetGame}
      />
    </div>
  );
}
