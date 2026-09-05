export interface ResearchStandard {
  code: string;
  title: string;
  authority: string;
  scope: string;
}

export const RESEARCH_STANDARDS: ResearchStandard[] = [
  {
    code: 'IS 12894:2002',
    title: 'Pulverized Fuel Ash-Lime Bricks — Specification',
    authority: 'Bureau of Indian Standards',
    scope: 'Defines physical, mechanical and durability requirements including compressive strength classes (Class 7.5 to Class 20) and maximum water absorption limits (≤ 20% by mass).'
  },
  {
    code: 'IS 3812:2013 Part 1',
    title: 'Pulverized Fuel Ash — Specification for Use as Pozzolana in Cement, Mortar and Concrete',
    authority: 'Bureau of Indian Standards',
    scope: 'Chemical and physical specifications for siliceous (Class F) and calcareous (Class C) fly ash derived from thermal power stations.'
  },
  {
    code: 'IS 3495 (Parts 1 to 4)',
    title: 'Methods of Tests of Burnt Clay Building Bricks',
    authority: 'Bureau of Indian Standards',
    scope: 'Standardized testing procedures for compressive strength, water absorption by 24h cold immersion, efflorescence, and dimensional tolerance.'
  },
  {
    code: 'ASTM C618-22',
    title: 'Standard Specification for Coal Fly Ash and Raw or Calcined Natural Pozzolan for Use in Concrete',
    authority: 'ASTM International',
    scope: 'International reference defining silicon, aluminum, and iron oxide thresholds (SiO2 + Al2O3 + Fe2O3 ≥ 70% for Class F pozzolans).'
  }
];

export const RESEARCH_KEY_FACTS = [
  {
    title: 'Thermal Fly Ash Utilization',
    detail: 'India produces over 280 million tonnes of coal combustion fly ash annually. High-volume brick manufacturing provides an essential zero-landfill valorization pathway.'
  },
  {
    title: 'Topsoil & Clinker Preservation',
    detail: 'Conventional clay brick production strips fertile agricultural topsoil and consumes energy-intensive kiln firing (~1000°C), while fly ash bricks cure through exothermic pozzolanic reactions.'
  },
  {
    title: 'The Literature Fragmentation Problem',
    detail: 'Over 600 peer-reviewed papers report fly ash brick experiments, but lack standard feature schemas, reproducible reporting units, and unified open benchmark datasets.'
  },
  {
    title: 'Adaptive Optimization Value',
    detail: 'Automated formulation matching allows brick manufacturers to adaptively tune mix ratios when local fly ash reactivity or lime purity fluctuates from batch to batch.'
  }
];
