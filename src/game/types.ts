/**
 * Ping Flood Angler 3D - Types & Interfaces
 */

export type GamePhase =
  | 'title'
  | 'idle'
  | 'aiming'
  | 'casting'
  | 'waiting'
  | 'bite'
  | 'fighting'
  | 'caught'
  | 'snapped'
  | 'paused';

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface FishSpecies {
  id: string;
  name: string;
  thaiName: string;
  scientificName: string;
  rarity: FishRarity;
  minWeightKg: number;
  maxWeightKg: number;
  minLengthCm: number;
  maxLengthCm: number;
  baseValue: number;
  fightAggression: number; // 1 to 5
  leapTendency: number; // 0 to 1
  currentResistance: number; // How much it pulls with the river current
  color: string;
  finColor: string;
  bellyColor: string;
  pattern: 'plain' | 'striped' | 'spotted' | 'catfish_whiskers';
  description: string;
  funFact: string;
}

export interface CaughtFishRecord {
  speciesId: string;
  weightKg: number;
  lengthCm: number;
  coinsEarned: number;
  timestamp: number;
}

export interface TackleGear {
  rodTier: number; // 1: Bamboo/Standard, 2: Ashino Fighter, 3: Ashino Tycoon 3000 Carbon
  lineTier: number; // 1: Monofilament, 2: Braided PE3, 3: Heavy Duty Monster Braid
  sinkerTier: number; // 1: Light Lead, 2: Heavy Ping River Torrent Sinker, 3: Hydrodynamic Tungsten
  baitTier: number; // 1: Earthworms, 2: Fermented Bread Paste, 3: Secret Chiang Mai Herbal Formula
}

export interface PlayerStats {
  coins: number;
  reputation: number;
  totalCatches: number;
  biggestFishKg: number;
  gear: TackleGear;
  unlockedCatches: Record<string, { count: number; maxWeight: number }>;
}

export interface CastParameters {
  angle: number; // Left/Right direction (-0.5 to 0.5)
  power: number; // 0.0 to 1.0
  distance: number; // meters from bank (8m to 35m)
}

export interface FightState {
  fish: FishSpecies;
  fishWeightKg: number;
  fishLengthCm: number;
  fishStamina: number; // 0 to 100
  fishMaxStamina: number;
  lineTension: number; // 0 to 100
  lineDistance: number; // meters to shore (reeling brings it to 0)
  initialDistance: number;
  isLeaping: boolean;
  leapProgress: number; // 0 to 1
  fishAction: 'charging' | 'thrashing' | 'running_downstream' | 'tiring';
  fishActionTimer: number;
  recommendedPull: 'left' | 'right' | 'center' | 'slack';
  currentDriftOffset: number; // drift along the river X
}
