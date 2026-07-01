import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Download, FileImage, Cpu, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

const SandboxPage = ({ onContinue }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Sandbox...');

  // Track progress and update messages dynamically
  useEffect(() => {
    if (!isInitializing) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 35); // Approx 3.5 seconds total duration

    return () => clearInterval(interval);
  }, [isInitializing]);

  // Dynamically change status message based on progress percentage
  useEffect(() => {
    if (progress < 25) {
      setLoadingText('Initializing demonstration sandbox environment...');
    } else if (progress < 50) {
      setLoadingText('Configuring forensic search engines & target logs...');
    } else if (progress < 75) {
      setLoadingText('Synchronizing visual index database modules...');
    } else if (progress < 100) {
      setLoadingText('Establishing secure secure-shell console connection...');
    } else {
      setLoadingText('Sandbox ready. Launching console...');
      // Hold for 600ms on completion, then proceed
      const timer = setTimeout(() => {
        onContinue();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [progress, onContinue]);

  const handleDownload = () => {
    // 1. Trigger the download of the image
    const link = document.createElement('a');
    link.href = '/images (14).jpeg';
    link.download = 'images (14).jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Start the initialization progress bar
    setIsInitializing(true);
  };

  // Motion variants for sleek entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 relative select-none w-full max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Decorative corners for professional interface details */}
      <div className="absolute -top-4 -left-4 w-8 h-8 border-t border-l border-slate-700/60 pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-8 h-8 border-t border-r border-slate-700/60 pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b border-l border-slate-700/60 pointer-events-none" />
      <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b border-r border-slate-700/60 pointer-events-none" />

      {/* Top Badge: Evaluator Guide */}
      <motion.div
        className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 font-mono text-xs uppercase tracking-widest"
        variants={itemVariants}
      >
        <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
        <span>Evaluator Sandbox Mode</span>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-4xl md:text-5xl font-black tracking-tight mb-8 select-text font-sora"
        variants={itemVariants}
      >
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-white drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          NETRA Demo Sandbox
        </span>
      </motion.h1>

      {/* Main Glass Box */}
      <motion.div
        className="cyber-glass w-full rounded-2xl p-8 relative overflow-hidden border border-slate-800"
        variants={itemVariants}
      >
        {/* Subtle decorative target grid mark */}
        <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-slate-800/40 rounded-tr-2xl pointer-events-none" />

        <h3 className="text-lg font-bold text-white mb-4 text-left flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          Prototype Configuration Guide
        </h3>

        <div className="text-slate-300 text-sm leading-relaxed text-left space-y-4 font-sans">
          <p>
            Welcome Evaluator! The <strong>NETRA Visual Reconnaissance System</strong> is currently configured in a secure prototype demonstration environment.
          </p>
          <p>
            To verify our core visual database tracking capabilities, reverse-search indexing, threat log reporting, and AI case summary generations, you need a sample asset.
          </p>
          <p className="bg-[#070b19]/60 border border-cyan-500/10 p-3 rounded-lg text-slate-200 flex gap-3 items-start">
            <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5 font-mono text-[10px] font-bold">INFO</span>
            <span>
              Please download the designated test image below. Once downloaded, you can upload it at the <strong>Start Scan</strong> stage of the console to test the full automated investigation workflow.
            </span>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {!isInitializing ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center"
              >
                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="formal-btn w-full max-w-sm py-4 rounded-xl flex items-center justify-center gap-3 cursor-pointer select-none text-white hover:scale-[1.01] active:scale-[0.99] font-bold transition-all shadow-[0_0_20px_rgba(2,132,199,0.2)]"
                >
                  <Download className="w-5 h-5 text-cyan-300" />
                  DOWNLOAD TEST IMAGE
                </button>

                {/* File Details */}
                <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-500">
                  <FileImage className="w-4 h-4 text-slate-500" />
                  <span>images (14).jpeg (4.69 KB)</span>
                  <span>•</span>
                  <span className="text-cyan-500/80">JPEG Image Asset</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center text-left"
              >
                {/* Loading Progress Info */}
                <div className="flex justify-between items-center w-full mb-2 font-mono text-xs">
                  <span className="text-cyan-400 font-bold flex items-center gap-2 text-clip truncate max-w-[80%]">
                    {progress === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-[pulse_1s_infinite] shrink-0" />
                    ) : (
                      <Cpu className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    )}
                    {loadingText}
                  </span>
                  <span className="text-slate-400 font-bold">{progress}%</span>
                </div>

                {/* Progress bar wrapper */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.1 }}
                  />
                </div>

                <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" /> Target DB Ready
                  </span>
                  <span>•</span>
                  <span>Session Link Secure</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Security note / footer */}
      <motion.p
        className="mt-6 text-[10px] font-mono text-slate-600 uppercase tracking-widest"
        variants={itemVariants}
      >
        Demo Environment Sandbox • NETRA Core Protocol v2.1.0
      </motion.p>
    </motion.div>
  );
};

export default SandboxPage;
