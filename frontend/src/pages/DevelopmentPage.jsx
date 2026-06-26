import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertTriangle, CheckCircle, ArrowRight, FileImage } from 'lucide-react';

const DevelopmentPage = ({ onComplete }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer;
    if (downloaded && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (downloaded && countdown === 0) {
      onComplete();
    }
    return () => clearTimeout(timer);
  }, [downloaded, countdown, onComplete]);

  const handleDownload = () => {
    // Trigger download of images.jpeg
    const link = document.createElement('a');
    link.href = '/images.jpeg';
    link.download = 'NETRA_calibration_image.jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message and begin redirect timer
    setDownloaded(true);
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { staggerChildren: 0.15, duration: 0.6 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 max-w-xl mx-auto animate-fadeIn"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dev Alert Banner */}
      <motion.div
        className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-[9px] tracking-widest uppercase mb-6 shadow-[0_2px_12px_rgba(6,182,212,0.1)]"
        variants={itemVariants}
      >
        <AlertTriangle className="w-3 h-3" />
        Evaluator Guide
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-3xl md:text-4xl font-extrabold tracking-wide text-white mb-4"
        variants={itemVariants}
      >
        NETRA Demo Sandbox
      </motion.h1>

      {/* Description */}
      <motion.div
        className="text-slate-200 text-sm leading-relaxed mb-6 bg-slate-950/40 p-5 rounded-xl border border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        variants={itemVariants}
      >
        <p className="mb-3 font-semibold text-center">
          Welcome Judges! NETRA is currently configured in a secure prototype demo environment.
        </p>
        <p className="text-slate-400 text-center">
          To verify our visual search indexing, threat logs, and AI case summaries, please download the test image below and upload it in the scanning stage.
        </p>
      </motion.div>

      {/* Download Action Section */}
      <AnimatePresence mode="wait">
        {!downloaded ? (
          <motion.div
            key="action-download"
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.button
              onClick={handleDownload}
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(34,211,238,0.25)" }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-lg border border-cyan-500/50 bg-slate-950/80 hover:border-cyan-400 hover:bg-cyan-500/15 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              Download Test Image
            </motion.button>
            <span className="mt-2 text-[9px] font-mono text-slate-500 tracking-wider">
              NETRA_calibration_image.jpeg (4.7 KB)
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="action-success"
            className="w-full flex flex-col items-center p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl max-w-sm shadow-[0_4px_20px_rgba(16,185,129,0.05)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-3">
              <CheckCircle className="w-5 h-5 shrink-0" />
              Download Success!
            </div>
            
            <div className="flex items-center gap-3 text-left bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mb-4 w-full">
              <FileImage className="w-8 h-8 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-0.5">Next Step</p>
                <p className="text-slate-200 text-xs font-semibold leading-relaxed">
                  Upload this downloaded image inside the scan panel to trigger the forensic scan.
                </p>
              </div>
            </div>

            {/* Countdown / Redirect bar */}
            <div className="w-full text-center">
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1.5">
                Initializing Console in {countdown}s...
              </p>
              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DevelopmentPage;
