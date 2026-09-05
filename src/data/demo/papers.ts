/**
 * FlyAsh Intel — Research Literature Demo Data
 * 
 * NOTICE:
 * This dataset contains metadata for peer-reviewed academic papers used as
 * empirical sources for the literature extraction engine demonstration.
 * DO NOT treat OCR bounding coordinates as finished automated extraction outputs;
 * they illustrate the spatial layout parsing pipeline.
 */

export interface DemoPaper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  tables: number;
  pages: number;
  rawNotation: string;
  targetTable: string;
  boundingBox: { x: number; y: number; w: number; h: number };
  abstract: string;
  extractedMixCount: number;
}

export const DEMO_RESEARCH_PAPERS: DemoPaper[] = [
  {
    id: 'paper-1',
    title: 'Experimental Investigation on Pozzolanic Reactivity of Class F Fly Ash-Lime-Gypsum Bricks',
    authors: 'Kumar & Prasad',
    journal: 'Construction and Building Materials',
    year: 2021,
    doi: '10.1016/j.conbuildmat.2021.124501',
    tables: 4,
    pages: 12,
    rawNotation: 'Mass ratio (g/batch)',
    targetTable: 'Table 4: Mix proportions and 28-day mechanical properties',
    boundingBox: { x: 44, y: 180, w: 480, h: 160 },
    abstract: 'Investigation into the stoichiometric proportioning of industrial fly ash, hydrated lime, and phospho-gypsum for masonry applications under ambient atmospheric curing conditions.',
    extractedMixCount: 8,
  },
  {
    id: 'paper-2',
    title: 'Mechanical and Durability Properties of High Volume Fly Ash Bricks with OPC Additives',
    authors: 'Shaikh et al.',
    journal: 'Materials and Structures (RILEM)',
    year: 2019,
    doi: '10.1016/j.conbuildmat.2019.04.112',
    tables: 3,
    pages: 9,
    rawNotation: 'Dry wt% fraction',
    targetTable: 'Table 2: Chemical analysis and compressive resistance',
    boundingBox: { x: 44, y: 220, w: 480, h: 140 },
    abstract: 'Evaluates early strength kinetics and 24-hour cold water absorption when incorporating 3-8% Ordinary Portland Cement clinker into high-volume fly ash matrix.',
    extractedMixCount: 6,
  },
  {
    id: 'paper-3',
    title: 'Steam-Cured Fly Ash-Quarry Dust Bricks for High-Strength Masonry Units',
    authors: 'Turgut & Algin',
    journal: 'ASCE Journal of Materials in Civil Engineering',
    year: 2020,
    doi: '10.1061/(ASCE)MT.1943-5533.0003011',
    tables: 5,
    pages: 14,
    rawNotation: 'kg/m³ batch mass',
    targetTable: 'Table 3: Specimen composition and absorption limits',
    boundingBox: { x: 44, y: 150, w: 480, h: 170 },
    abstract: 'Explores accelerated low-pressure steam curing to achieve high load-bearing capacity (>20 MPa) using pulverized coal fly ash and quarry rock dust filler.',
    extractedMixCount: 4,
  },
];
