/**
 * GameManager - 60fps Simulation Loop & State Machine for Ping Flood Angler 3D
 * Decoupled from React renders to ensure silky 60fps performance and responsive input buffering.
 */

import { RiverScene } from './three/RiverScene';
import { FISH_SPECIES, GEAR_UPGRADES } from './fishData';
import { sound } from './audio';
import { GamePhase, FishSpecies, PlayerStats, FightState, CastParameters } from './types';

const STORAGE_KEY = 'ping_flood_angler_save_v1';

export class GameManager {
  public scene: RiverScene;
  public phase: GamePhase = 'title';

  // Player Stats
  public stats: PlayerStats = {
    coins: 150,
    reputation: 0,
    totalCatches: 0,
    biggestFishKg: 0,
    gear: {
      rodTier: 1,
      lineTier: 1,
      sinkerTier: 1,
      baitTier: 1,
    },
    unlockedCatches: {},
  };

  // Cast state
  public castAim: { x: number; distance: number } = { x: 0, distance: 16 };
  public castPower: number = 0;
  public castPowerDir: number = 1;
  public isChargingCast: boolean = false;

  // Waiting / Bite state
  public driftTimer: number = 0;
  public biteTargetTime: number = 0;
  public biteReactionWindow: number = 0;
  public targetedFish: FishSpecies | null = null;
  public prospectiveWeightKg: number = 0;
  public prospectiveLengthCm: number = 0;

  // Fight state
  public fight: FightState | null = null;
  public lastCaughtFish: {
    species: FishSpecies;
    weightKg: number;
    lengthCm: number;
    coinsEarned: number;
    isNewRecord: boolean;
  } | null = null;

  // Input states
  public keysHeld: Record<string, boolean> = {};
  public mouseHeld: boolean = false;
  private animId: number = 0;
  private lastTime: number = 0;
  private hitstopTimer: number = 0;

  // Listeners for React UI updates (throttled to UI frame rates)
  private onStateChange: (manager: GameManager) => void;

  constructor(scene: RiverScene, onStateChange: (manager: GameManager) => void) {
    this.scene = scene;
    this.onStateChange = onStateChange;

    this.loadStats();
    this.setupInputs();
    this.startLoop();
  }

  private loadStats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.stats = { ...this.stats, ...parsed };
      }
    } catch {
      // Use defaults
    }
  }

  public saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Ignore
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = true;

    if (e.code === 'KeyM') {
      sound.toggleMute();
      this.notifyUI();
      return;
    }

    if (e.code === 'Escape') {
      if (this.phase === 'paused') {
        this.phase = 'idle';
        this.notifyUI();
      } else if (this.phase === 'fighting' || this.phase === 'waiting' || this.phase === 'aiming') {
        this.phase = 'paused';
        this.notifyUI();
      }
      return;
    }

    if (this.phase === 'title') {
      if (e.code === 'Enter' || e.code === 'Space') {
        this.startGame();
      }
      return;
    }

    if (this.phase === 'idle') {
      if (e.code === 'Space' || e.code === 'KeyC') {
        this.startAiming();
      }
      return;
    }

    if (this.phase === 'aiming') {
      if (e.code === 'Space') {
        this.startChargingCast();
      }
      return;
    }

    if (this.phase === 'bite') {
      if (e.code === 'Space' || e.code === 'KeyC' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.executeStrike();
      }
      return;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = false;

    if (this.phase === 'casting' && e.code === 'Space') {
      this.releaseCast();
    }
  };

  private onWindowBlur = () => {
    this.keysHeld = {};
    this.mouseHeld = false;
  };

  public startGame() {
    sound.playUiClick();
    this.phase = 'idle';
    this.scene.cameraViewMode = 'angler';
    this.notifyUI();
  }

  public startAiming() {
    sound.playUiClick();
    this.phase = 'aiming';
    this.castAim = { x: 0, distance: 16 };
    this.scene.targetIndicator.visible = true;
    this.notifyUI();
  }

  public startChargingCast() {
    this.phase = 'casting';
    this.castPower = 0.1;
    this.castPowerDir = 1;
    this.isChargingCast = true;
    this.notifyUI();
  }

  public releaseCast() {
    if (this.phase !== 'casting') return;
    this.isChargingCast = false;
    sound.playCast();

    // Calculate cast landing coordinates in Ping River
    const sinkerTier = this.stats.gear.sinkerTier;
    const bonus = GEAR_UPGRADES.sinkers[sinkerTier - 1]?.castBonus || 0;
    const targetDist = this.castAim.distance + this.castPower * 12 + bonus * 0.4;
    const landingX = this.castAim.x;
    const landingZ = -targetDist;

    // Fling float in 3D scene
    this.scene.targetIndicator.visible = false;
    this.scene.floatPosition.set(landingX, 0.1, landingZ);
    this.scene.isFloatActive = true;
    this.scene.triggerSplash(landingX, 0, landingZ, 25);
    sound.playWaterSplash(0.8);

    // Pick prospective fish
    this.rollFishSpecies();

    this.phase = 'waiting';
    this.driftTimer = 0;
    // Bite arrives between 2.5 and 7 seconds
    this.biteTargetTime = 2.8 + Math.random() * 4.2;
    this.notifyUI();
  }

  private rollFishSpecies() {
    const baitTier = this.stats.gear.baitTier;
    const rareBonus = GEAR_UPGRADES.baits[baitTier - 1]?.rareChanceBonus || 0;

    // Weight probabilities
    const roll = Math.random() + rareBonus * 0.25;
    let chosen: FishSpecies;

    if (roll > 1.05) {
      chosen = FISH_SPECIES.find((f) => f.id === 'pla_buk') || FISH_SPECIES[5];
    } else if (roll > 0.88) {
      chosen = FISH_SPECIES.find((f) => f.id === 'golden_mahseer') || FISH_SPECIES[4];
    } else if (roll > 0.65) {
      chosen = FISH_SPECIES.find((f) => f.id === 'pla_kang') || FISH_SPECIES[3];
    } else if (roll > 0.45) {
      chosen = FISH_SPECIES.find((f) => f.id === 'pla_sawai') || FISH_SPECIES[2];
    } else if (roll > 0.25) {
      chosen = FISH_SPECIES.find((f) => f.id === 'pla_chon') || FISH_SPECIES[1];
    } else {
      chosen = FISH_SPECIES[0]; // Pla Tapian
    }

    // Rare chance to snag flooded tuk-tuk relic
    if (Math.random() < 0.08) {
      chosen = FISH_SPECIES.find((f) => f.id === 'flooded_tuktuk_wheel') || chosen;
    }

    this.targetedFish = chosen;

    // Generate weight & length
    const weightNorm = Math.random();
    this.prospectiveWeightKg = Number(
      (chosen.minWeightKg + weightNorm * (chosen.maxWeightKg - chosen.minWeightKg)).toFixed(1)
    );
    this.prospectiveLengthCm = Math.round(
      chosen.minLengthCm + weightNorm * (chosen.maxLengthCm - chosen.minLengthCm)
    );
  }

  public executeStrike() {
    if (this.phase !== 'bite' || !this.targetedFish) return;

    sound.playBiteAlert();
    this.scene.applyCameraShake(1.5);
    this.hitstopTimer = 0.08; // 80ms hitstop punch
    this.scene.triggerSplash(this.scene.floatPosition.x, 0, this.scene.floatPosition.z, 30);

    // Initialize Fight state
    const fish = this.targetedFish;
    const baseStamina = 60 + fish.fightAggression * 14;
    const initialDist = Math.abs(this.scene.floatPosition.z);

    this.fight = {
      fish,
      fishWeightKg: this.prospectiveWeightKg,
      fishLengthCm: this.prospectiveLengthCm,
      fishStamina: baseStamina,
      fishMaxStamina: baseStamina,
      lineTension: 35,
      lineDistance: initialDist,
      initialDistance: initialDist,
      isLeaping: false,
      leapProgress: 0,
      fishAction: 'charging',
      fishActionTimer: 1.5,
      recommendedPull: 'center',
      currentDriftOffset: this.scene.floatPosition.x,
    };

    // Update 3D Fish skin & position
    this.scene.updateFishSkin(fish);
    this.scene.fishPosition.set(this.scene.floatPosition.x, -0.4, this.scene.floatPosition.z);
    this.scene.isFishVisible = true;

    this.phase = 'fighting';
    this.notifyUI();
  }

  private snapLine() {
    sound.playLineSnap();
    this.scene.applyCameraShake(1.8);
    this.scene.isFloatActive = false;
    this.scene.isFishVisible = false;
    this.scene.updateRodBend(0, 0, 0.05);

    this.fight = null;
    this.phase = 'snapped';
    this.notifyUI();

    setTimeout(() => {
      if (this.phase === 'snapped') {
        this.phase = 'idle';
        this.notifyUI();
      }
    }, 2400);
  }

  private hookSlips() {
    this.scene.isFloatActive = false;
    this.scene.isFishVisible = false;
    this.scene.updateRodBend(0, 0, 0.05);
    this.fight = null;
    this.phase = 'idle';
    this.notifyUI();
  }

  private victoryCatch() {
    if (!this.fight) return;

    const fish = this.fight.fish;
    const weight = this.fight.fishWeightKg;
    const length = this.fight.fishLengthCm;

    // Reward calculation based on weight multiplier
    const weightRatio = weight / fish.minWeightKg;
    const coinsEarned = Math.round(fish.baseValue * Math.max(1, weightRatio * 0.7));

    const prevRecord = this.stats.unlockedCatches[fish.id]?.maxWeight || 0;
    const isNewRecord = weight > prevRecord;

    // Update player records
    this.stats.coins += coinsEarned;
    this.stats.totalCatches += 1;
    this.stats.biggestFishKg = Math.max(this.stats.biggestFishKg, weight);

    const prevCount = this.stats.unlockedCatches[fish.id]?.count || 0;
    this.stats.unlockedCatches[fish.id] = {
      count: prevCount + 1,
      maxWeight: Math.max(prevRecord, weight),
    };

    this.saveStats();

    this.lastCaughtFish = {
      species: fish,
      weightKg: weight,
      lengthCm: length,
      coinsEarned,
      isNewRecord,
    };

    sound.playVictoryFanfare(fish.rarity);
    this.scene.triggerSplash(0, 1.2, 0, 45);
    this.scene.isFloatActive = false;
    this.scene.isFishVisible = false;

    this.fight = null;
    this.phase = 'caught';
    this.notifyUI();
  }

  public dismissCatchModal() {
    this.phase = 'idle';
    this.notifyUI();
  }

  /**
   * Main 60fps simulation tick
   */
  private update(dt: number) {
    const clampedDt = Math.min(dt, 0.05);

    // Hitstop handling (simulation freeze on impact)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= clampedDt;
      return;
    }

    const t = performance.now() * 0.001;

    // Phase: TITLE (scenic camera sway over flood)
    if (this.phase === 'title') {
      this.scene.camera.position.x = Math.sin(t * 0.3) * 6;
      this.scene.camera.position.y = 5.2 + Math.cos(t * 0.25) * 0.8;
      this.scene.camera.position.z = 9.5;
      this.scene.camera.lookAt(0, 1.5, -16);
    }

    // Phase: AIMING
    if (this.phase === 'aiming') {
      const moveSpeed = 16;
      if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) {
        this.castAim.x = Math.max(-25, this.castAim.x - moveSpeed * clampedDt);
      }
      if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) {
        this.castAim.x = Math.min(25, this.castAim.x + moveSpeed * clampedDt);
      }
      if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) {
        this.castAim.distance = Math.min(32, this.castAim.distance + moveSpeed * clampedDt);
      }
      if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) {
        this.castAim.distance = Math.max(9, this.castAim.distance - moveSpeed * clampedDt);
      }

      this.scene.targetIndicator.position.set(this.castAim.x, 0.15, -this.castAim.distance);
    }

    // Phase: CASTING (power charging)
    if (this.phase === 'casting') {
      this.castPower += this.castPowerDir * clampedDt * 1.6;
      if (this.castPower >= 1.0) {
        this.castPower = 1.0;
        this.castPowerDir = -1;
      } else if (this.castPower <= 0.1) {
        this.castPower = 0.1;
        this.castPowerDir = 1;
      }
    }

    // Phase: WAITING (float drifting in flood current)
    if (this.phase === 'waiting') {
      this.driftTimer += clampedDt;
      // Ping flood current pulls float downstream (to the right)
      const sinkerTier = this.stats.gear.sinkerTier;
      const driftDamping = GEAR_UPGRADES.sinkers[sinkerTier - 1]?.driftDamping || 1.0;
      const driftSpeed = 3.2 / driftDamping;
      this.scene.floatPosition.x += driftSpeed * clampedDt;

      // Small bait nibbles near bite time
      if (this.driftTimer >= this.biteTargetTime - 0.9 && this.driftTimer < this.biteTargetTime) {
        this.scene.updateRodBend(0.18 * Math.sin(t * 18), 0, clampedDt);
      }

      // Strike alert triggers!
      if (this.driftTimer >= this.biteTargetTime) {
        sound.playBiteAlert();
        this.phase = 'bite';
        this.biteReactionWindow = 1.4; // 1.4 seconds to hook
        this.scene.applyCameraShake(0.8);
        this.scene.triggerSplash(this.scene.floatPosition.x, 0, this.scene.floatPosition.z, 15);
        this.notifyUI();
      }
    }

    // Phase: BITE (reaction window)
    if (this.phase === 'bite') {
      this.biteReactionWindow -= clampedDt;
      this.scene.updateRodBend(0.65 + Math.sin(t * 22) * 0.15, 0, clampedDt);

      if (this.biteReactionWindow <= 0) {
        // Missed bite! Fish stole bait
        this.scene.isFloatActive = false;
        this.phase = 'idle';
        this.notifyUI();
      }
    }

    // Phase: FIGHTING (thrilling rod vs monster battle)
    if (this.phase === 'fighting' && this.fight) {
      this.updateFightPhysics(clampedDt);
    }

    // Update 3D scene visuals
    this.scene.update(clampedDt, t);
  }

  /**
   * Complex, rewarding action fishing mechanics
   */
  private updateFightPhysics(dt: number) {
    if (!this.fight) return;
    const f = this.fight;
    const gear = this.stats.gear;

    const rodTier = gear.rodTier;
    const lineTier = gear.lineTier;
    const rodConfig = GEAR_UPGRADES.rods[rodTier - 1];
    const lineConfig = GEAR_UPGRADES.lines[lineTier - 1];

    const isReeling = this.keysHeld['Space'] || this.keysHeld['KeyW'] || this.keysHeld['ArrowUp'] || this.mouseHeld;
    const isPullLeft = this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft'];
    const isPullRight = this.keysHeld['KeyD'] || this.keysHeld['ArrowRight'];
    const isSlack = this.keysHeld['KeyS'] || this.keysHeld['ArrowDown'];

    // Fish Action Cycle
    f.fishActionTimer -= dt;
    if (f.fishActionTimer <= 0) {
      // Pick next fish behavior
      const rand = Math.random();
      if (rand < f.fish.leapTendency && !f.isLeaping) {
        f.fishAction = 'thrashing';
        f.isLeaping = true;
        f.leapProgress = 0;
        f.fishActionTimer = 1.8;
        f.recommendedPull = 'slack';
        sound.playWaterSplash(1.4);
        this.scene.applyCameraShake(1.2);
      } else if (rand < 0.6) {
        f.fishAction = 'running_downstream';
        f.fishActionTimer = 2.0;
        f.recommendedPull = 'left'; // Counter pull
      } else if (rand < 0.85) {
        f.fishAction = 'charging';
        f.fishActionTimer = 1.6;
        f.recommendedPull = 'right';
      } else {
        f.fishAction = 'tiring';
        f.fishActionTimer = 2.4;
        f.recommendedPull = 'center';
      }
    }

    // Leap handling (fish jumps out of water in 3D!)
    if (f.isLeaping) {
      f.leapProgress += dt * 1.5;
      const leapY = Math.sin(f.leapProgress * Math.PI) * 2.8;
      this.scene.fishLeapHeight = Math.max(0, leapY);

      if (f.leapProgress >= 1.0) {
        f.isLeaping = false;
        this.scene.fishLeapHeight = 0;
        this.scene.triggerSplash(this.scene.fishPosition.x, 0, this.scene.fishPosition.z, 28);
        sound.playWaterSplash(1.2);
      }
    }

    // Tension dynamics
    let tensionDelta = 0;
    const maxTensionThreshold = 100 * (lineConfig.snapMargin || 1.0);

    if (isReeling) {
      tensionDelta += 38 * dt;
      sound.playReelClick();

      // Bringing distance closer
      const reelPower = rodConfig.reelSpeed * (1.8 / Math.max(1, f.fishWeightKg * 0.15));
      f.lineDistance = Math.max(0, f.lineDistance - reelPower * dt);
    } else {
      tensionDelta -= 22 * dt;
    }

    if (isSlack) {
      tensionDelta -= 48 * dt;
    }

    // Directional leverage
    let sidePull = 0;
    if (isPullLeft) sidePull -= 1;
    if (isPullRight) sidePull += 1;

    // Check if player is matching the recommended counter-pull
    let isCorrectTactic = false;
    if (f.recommendedPull === 'slack' && (isSlack || !isReeling)) {
      isCorrectTactic = true;
    } else if (f.recommendedPull === 'left' && isPullLeft) {
      isCorrectTactic = true;
    } else if (f.recommendedPull === 'right' && isPullRight) {
      isCorrectTactic = true;
    } else if (f.recommendedPull === 'center') {
      isCorrectTactic = true;
    }

    // Stamina drain
    if (isCorrectTactic) {
      f.fishStamina -= 16 * dt * (rodConfig.reelSpeed || 1);
    } else {
      // Wrong tactic spikes tension and lets fish surge
      tensionDelta += 24 * dt;
      if (f.fishAction === 'running_downstream') {
        f.lineDistance = Math.min(f.initialDistance + 8, f.lineDistance + 4.5 * dt);
        sound.playDragScream();
      }
    }

    // River flood current effect (Pushes fish downstream)
    const floodPull = f.fish.currentResistance * 2.5;
    f.currentDriftOffset += (floodPull + sidePull * -4.5) * dt;

    // Apply tension
    f.lineTension = Math.max(0, Math.min(120, f.lineTension + tensionDelta));

    // Update 3D visual positions
    this.scene.floatPosition.set(f.currentDriftOffset, 0.1, -f.lineDistance);
    this.scene.fishPosition.set(f.currentDriftOffset, f.isLeaping ? this.scene.fishLeapHeight : -0.5, -f.lineDistance);

    // Rod flex and side bend
    const tensionNorm = Math.min(1.0, f.lineTension / 80);
    this.scene.updateRodBend(tensionNorm, sidePull, dt);

    // Fail condition 1: Line snapped!
    if (f.lineTension >= maxTensionThreshold) {
      this.snapLine();
      return;
    }

    // Fail condition 2: Hook slipped (too much slack for too long)
    if (f.lineTension <= 2 && f.fishStamina > 10 && !f.isLeaping) {
      this.hookSlips();
      return;
    }

    // Success condition: Fish reeled to shore (distance <= 1.5m)
    if (f.lineDistance <= 1.5) {
      this.victoryCatch();
      return;
    }
  }

  public buyUpgrade(type: 'rod' | 'line' | 'sinker' | 'bait', tier: number): boolean {
    let list: Array<{ tier: number; price: number }>;
    if (type === 'rod') list = GEAR_UPGRADES.rods;
    else if (type === 'line') list = GEAR_UPGRADES.lines;
    else if (type === 'sinker') list = GEAR_UPGRADES.sinkers;
    else list = GEAR_UPGRADES.baits;

    const item = list.find((it) => it.tier === tier);
    if (!item) return false;

    if (this.stats.coins >= item.price) {
      this.stats.coins -= item.price;
      if (type === 'rod') this.stats.gear.rodTier = tier;
      if (type === 'line') this.stats.gear.lineTier = tier;
      if (type === 'sinker') this.stats.gear.sinkerTier = tier;
      if (type === 'bait') this.stats.gear.baitTier = tier;

      sound.playUiClick();
      this.saveStats();
      this.notifyUI();
      return true;
    }
    return false;
  }

  private startLoop() {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - this.lastTime) * 0.001;
      this.lastTime = now;
      this.update(dt);
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  private notifyUI() {
    this.onStateChange(this);
  }

  public destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
  }
}
