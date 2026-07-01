import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';

import SandboxPage from './pages/SandboxPage';
import HeroPage from './pages/HeroPage';
import HomePage from './pages/HomePage';
import InvestigationPage from './pages/InvestigationPage';
import LiveProcessPage from './pages/LiveProcessPage';
import ResultsPage from './pages/ResultsPage';
import CasesPage from './pages/CasesPage';
import ReportsPage from './pages/ReportsPage';
import LeakViewer from './pages/LeakViewer';
import LightningBackground from './components/LightningBackground';

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('sandbox');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [leakViewParams, setLeakViewParams] = useState(null);

  // Check if we are visiting a public leak view link
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/leak-view\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (match) {
      setLeakViewParams({
        caseId: match[1],
        domain: match[2],
        slug: match[3],
      });
      setPage('leak-viewer');
    }
  }, []);

  const navigateTo = (nextPage, caseId = null) => {
    if (caseId) setSelectedCaseId(caseId);
    setPage(nextPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-bg-dark scanline-container">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-cyber-green border-cyber-blue/20 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,170,0.4)]" />
          <p className="font-orbitron text-cyber-blue font-bold tracking-widest uppercase text-sm animate-pulse">
            Booting NETRA Systems...
          </p>
        </div>
      </div>
    );
  }

  // Page animation settings
  const pageVariants = {
    initial: { opacity: 0, scale: 0.96, y: 15 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
    },
    exit: { 
      opacity: 0, 
      scale: 1.04, 
      y: -15,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div className="min-h-screen relative text-slate-100 font-rajdhani select-none overflow-x-hidden scanline-container scanline-animation">
      {/* Live Canvas Background */}
      <LightningBackground />

      {/* Cyber Grid Pattern Overlay */}
      <div className="cyber-grid" />

      {/* Main Pages with AnimatePresence for transitions */}
      <main className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">

          {page === 'sandbox' && (
            <motion.div key="sandbox" className="w-full max-w-3xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <SandboxPage onContinue={() => navigateTo('hero')} />
            </motion.div>
          )}

          {page === 'hero' && (
            <motion.div key="hero" className="w-full max-w-4xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <HeroPage onStart={() => navigateTo('home')} />
            </motion.div>
          )}

          {page === 'home' && (
            <motion.div key="home" className="w-full max-w-5xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <HomePage navigateTo={navigateTo} />
            </motion.div>
          )}

          {page === 'investigation' && (
            <motion.div key="investigation" className="w-full max-w-3xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <InvestigationPage navigateTo={navigateTo} />
            </motion.div>
          )}

          {page === 'live-process' && (
            <motion.div key="live-process" className="w-full max-w-3xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <LiveProcessPage caseId={selectedCaseId} navigateTo={navigateTo} />
            </motion.div>
          )}

          {page === 'results' && (
            <motion.div key="results" className="w-full max-w-6xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ResultsPage caseId={selectedCaseId} navigateTo={navigateTo} />
            </motion.div>
          )}

          {page === 'cases' && (
            <motion.div key="cases" className="w-full max-w-5xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <CasesPage navigateTo={navigateTo} />
            </motion.div>
          )}

          {page === 'reports' && (
            <motion.div key="reports" className="w-full max-w-5xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ReportsPage navigateTo={navigateTo} />
            </motion.div>
          )}

          {page === 'leak-viewer' && leakViewParams && (
            <motion.div key="leak-viewer" className="w-full max-w-4xl" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <LeakViewer 
                caseId={leakViewParams.caseId} 
                domain={leakViewParams.domain} 
                slug={leakViewParams.slug} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
