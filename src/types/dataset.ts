export interface FlyAshMixRecord {
  id: string;
  paperId: string;
  authors: string;
  year: number;
  mixId: string;
  flyAshPercent: number;
  cementPercent: number;
  limePercent: number;
  gypsumPercent: number;
  sandPercent: number;
  quarryDustPercent: number;
  waterBinderRatio: number;
  curingDays: number;
  curingType: 'Water' | 'Steam' | 'Ambient';
  compressiveStrength: number; // in MPa
  waterAbsorption: number; // in %
  density: number; // in kg/m³
  is12894Class: 'Class 7.5' | 'Class 10' | 'Class 12.5' | 'Class 15' | 'Class 17.5' | 'Class 20' | 'Class 25' | 'Class 30' | 'Non-Conforming';
  validationStatus: 'Verified' | 'Standardized' | 'Flagged';
  notes?: string;
}

export interface DatasetFilterState {
  searchQuery: string;
  minFlyAsh: number;
  maxFlyAsh: number;
  curingDays: number | 'all';
  minStrength: number;
  maxAbsorption: number;
  isClass: string;
}
