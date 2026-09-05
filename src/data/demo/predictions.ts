/**
 * FlyAsh Intel — Quality Prediction Demo Constants & Heuristics
 * 
 * NOTICE:
 * These formulation presets and surrogate calculations illustrate frontend
 * interactive response curves. They represent computational heuristics
 * calibrated on pozzolanic FaL-G literature prior to final trained model export.
 */

export interface MixPreset {
  id: string;
  name: string;
  description: string;
  flyAsh: number;
  cement: number;
  lime: number;
  gypsum: number;
  waterBinder: number;
  sand: number;
  expectedClass: string;
}

export const DEMO_MIX_PRESETS: Record<'falg' | 'hvfa' | 'hybrid', MixPreset> = {
  falg: {
    id: 'preset-falg',
    name: 'FaL-G Standard Reference',
    description: 'Zero-clinker ternary pozzolanic binder using Class F fly ash, hydrated lime, and phospho-gypsum.',
    flyAsh: 65,
    cement: 0,
    lime: 18,
    gypsum: 5,
    sand: 12,
    waterBinder: 0.14,
    expectedClass: 'Class 15',
  },
  hvfa: {
    id: 'preset-hvfa',
    name: 'High-Volume Fly Ash (HVFA)',
    description: 'Maximum industrial byproduct utilization with 75% fly ash for eco-partition masonry.',
    flyAsh: 75,
    cement: 0,
    lime: 14,
    gypsum: 4,
    sand: 7,
    waterBinder: 0.15,
    expectedClass: 'Class 10',
  },
  hybrid: {
    id: 'preset-hybrid',
    name: 'Hybrid Clinker Accelerated',
    description: 'Incorporates 8% OPC clinker to accelerate demolding kinetics and early handling strength.',
    flyAsh: 55,
    cement: 8,
    lime: 15,
    gypsum: 4,
    sand: 18,
    waterBinder: 0.13,
    expectedClass: 'Class 20',
  },
};

/**
 * Computational surrogate heuristic for client-side demo inference
 */
export function calculateDemoPrediction(
  flyAsh: number,
  cement: number,
  lime: number,
  gypsum: number,
  waterBinder: number,
  curingDays: number = 28
) {
  const binder = (lime * 0.42) + (gypsum * 0.75) + (cement * 0.95);
  const filler = (flyAsh * 0.12);
  const wbBonus = (0.20 - waterBinder) * 45;

  const base28d = Math.max(4.0, Math.min(26.5, binder + filler + wbBonus));
  
  // Curing age progression kinetics
  const str3d = parseFloat((base28d * 0.28).toFixed(1));
  const str7d = parseFloat((base28d * 0.54).toFixed(1));
  const str14d = parseFloat((base28d * 0.76).toFixed(1));
  const str28d = parseFloat(base28d.toFixed(1));

  let abs = 22.0 - (str28d * 0.52) - (cement * 0.15) - (lime * 0.1);
  abs = Math.max(7.5, Math.min(22.0, parseFloat(abs.toFixed(1))));

  let is12894Class = 'Class 10';
  if (str28d >= 20.0) is12894Class = 'Class 20';
  else if (str28d >= 17.5) is12894Class = 'Class 17.5';
  else if (str28d >= 15.0) is12894Class = 'Class 15';
  else if (str28d >= 12.5) is12894Class = 'Class 12.5';
  else if (str28d >= 10.0) is12894Class = 'Class 10';
  else if (str28d >= 7.5) is12894Class = 'Class 7.5';

  const currentAgeStrength = curingDays <= 3 ? str3d : curingDays <= 7 ? str7d : curingDays <= 14 ? str14d : str28d;

  return {
    str3d,
    str7d,
    str14d,
    str28d,
    currentAgeStrength,
    abs,
    is12894Class,
  };
}
