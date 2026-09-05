import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { PlatformHubPage } from './pages/PlatformHubPage';
import { ExtractionPage } from './pages/ExtractionPage';
import { DatasetPage } from './pages/DatasetPage';
import { PredictionPage } from './pages/PredictionPage';
import { OptimizationPage } from './pages/OptimizationPage';
import { ResearchPage } from './pages/ResearchPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Scroll to top on route navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <Navbar />
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/platform" element={<PlatformHubPage />} />
              <Route path="/platform/extraction" element={<ExtractionPage />} />
              <Route path="/platform/dataset" element={<DatasetPage />} />
              <Route path="/platform/prediction" element={<PredictionPage />} />
              <Route path="/platform/optimization" element={<OptimizationPage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/research/methodology" element={<MethodologyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
