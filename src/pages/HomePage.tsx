import React from 'react';
import { HeroSection } from '../components/hero/HeroSection';
import { ScrollPipelineStory } from '../components/scroll-story/ScrollPipelineStory';
import { ModulesSection } from '../components/modules/ModulesSection';
import { DatasetSection } from '../components/dataset/DatasetSection';
import { PredictionPreview } from '../components/prediction/PredictionPreview';
import { OptimizationPreview } from '../components/optimization/OptimizationPreview';
import { ResearchTrustSection } from '../components/research/ResearchTrustSection';
import { CTASection } from '../components/home/CTASection';

export const HomePage: React.FC = () => {
  return (
    <main>
      {/* 01. Flagship Hero with Interactive Pipeline Simulation */}
      <HeroSection />

      {/* 02. Interactive Scroll Story from Literature to Decision */}
      <ScrollPipelineStory />

      {/* 03. Core Platform Modules with Bespoke Previews */}
      <ModulesSection />

      {/* 04. Curated Benchmark Dataset & Schema Preview */}
      <DatasetSection />

      {/* 05. Adaptive Quality Prediction Engine Sandbox */}
      <PredictionPreview />

      {/* 06. Manufacturing Mix Optimizer & Pareto Search */}
      <OptimizationPreview />

      {/* 07. Scientific Rigor, Indian Standards & Methodology */}
      <ResearchTrustSection />

      {/* 08. Commanding Conversion / Launch CTA */}
      <CTASection />
    </main>
  );
};
