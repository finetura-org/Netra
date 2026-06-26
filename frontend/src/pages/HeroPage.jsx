import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronRight, Terminal } from 'lucide-react';

const HeroPage = ({ onStart }) => {
  // Animation configs
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 relative select-none"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* Decorative Technical Crosshairs (Low-opacity dashboard lines) */}
      <div className="absolute top-1/4 left-10 w-16 h-[1px] bg-white/10" />
      <div className="absolute top-1/4 left-10 w-[1px] h-16 bg-white/10" />
      <div className="absolute bottom-1/4 right-10 w-16 h-[1px] bg-white/10" />
      <div className="absolute bottom-1/4 right-10 w-[1px] h-16 bg-white/10" />

      {/* Main Centered Panel */}
      <div className="max-w-3xl w-full py-12 px-8 flex flex-col items-center relative z-10">
        
        {/* Sleek Scanner Badge Logo */}
        <motion.div 
          className="relative mb-8 flex items-center justify-center"
          variants={itemVariants}
        >
          {/* Animated spinning background rings */}
          <div className="absolute w-16 h-16 border border-dashed border-cyan-400/40 rounded-full animate-[spin-clockwise_15s_linear_infinite]" />
          <div className="absolute w-20 h-20 border border-double border-emerald-400/25 rounded-full animate-[spin-counter-clockwise_25s_linear_infinite]" />
          
          <motion.div 
            className="relative p-4 rounded-full border border-cyan-500/40 bg-slate-955 text-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Shield className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </motion.div>
        </motion.div>

        {/* Massive Bold Title with High Contrast Gradient & Pop */}
        <motion.h1 
          className="text-7xl md:text-9xl font-black tracking-tight mb-4 select-text"
          variants={itemVariants}
        >
          <motion.span 
            className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-white drop-shadow-[0_0_40px_rgba(34,211,238,0.35)] inline-block"
            whileHover={{ scale: 1.03, letterSpacing: "0.02em" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            NETRA
          </motion.span>
        </motion.h1>

        {/* Subtitle - Elevated contrast using slate-950 backdrop and high-brightness text */}
        <motion.p 
          className="font-mono text-xs md:text-sm text-cyan-200 tracking-[0.25em] uppercase font-extrabold mb-8 bg-slate-950/85 px-6 py-2 rounded-full border border-cyan-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          Network enabled tracking and reconnaissance analysis
        </motion.p>

        {/* Divider */}
        <motion.div 
          className="flex items-center gap-3 w-full justify-center mb-8"
          variants={itemVariants}
        >
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-cyan-500/40" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-emerald-500/40" />
        </motion.div>

        {/* High Contrast Description Text */}
        <motion.p 
          className="text-white font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          variants={itemVariants}
        >
          An automated visual forensics platform deployed to locate leaked screenshots, private media, and image archives. Scan deep indexes, verify EXIF headers, and compile actionable tracking evidence.
        </motion.p>

        {/* High-End Glowing Button */}
        <motion.button 
          onClick={onStart}
          variants={itemVariants}
          whileHover={{ 
            scale: 1.03,
            boxShadow: "0 0 35px rgba(16, 185, 129, 0.45)",
          }}
          whileTap={{ scale: 0.98 }}
          className="group relative px-10 py-4.5 rounded-lg overflow-hidden border border-cyan-500/50 bg-slate-950/80 hover:border-emerald-400/80 hover:bg-emerald-500/10 text-white font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_4px_25px_rgba(2,132,199,0.3)] cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <span className="relative flex items-center justify-center gap-2.5">
            <Terminal className="w-4.5 h-4.5 text-cyan-400 group-hover:text-emerald-400 transition-colors" />
            INITIALIZE SYSTEM
            <ChevronRight className="w-4.5 h-4.5 text-cyan-400 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
          </span>
        </motion.button>

      </div>

      {/* Footer Details */}
      <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest select-none">
        <span>SECURITY LEVEL: CLASS-A FORENSICS</span>
        <span>SYSTEM VERSION: 2.1.0</span>
      </div>
    </motion.div>
  );
};

export default HeroPage;
