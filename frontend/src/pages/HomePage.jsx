import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, PlusCircle, History, FileBarChart, Info } from 'lucide-react';
import api from '../api/client';

const HomePage = ({ navigateTo }) => {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalFindings: 0,
    activeCases: 0,
  });

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        const data = res.data;
        setStats({
          totalCases: data.total_cases || 0,
          totalFindings: data.total_findings || 0,
          activeCases: data.active_cases || 0,
        });
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
      });
  }, []);

  // Framer Motion presets
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      className="w-full flex flex-col min-h-[85vh]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Header Bar */}
      <motion.header 
        className="flex justify-between items-center w-full pb-6 border-b border-slate-800/80 mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
          <div className="text-left">
            <h2 className="text-xl font-bold tracking-wider text-white font-orbitron">
              NETRA CORE
            </h2>
            <span className="text-[10px] text-cyan-300/85 font-mono tracking-widest uppercase">Visual Intelligence Control Console</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          <span className="text-slate-200 uppercase tracking-widest font-bold">System Status: Active</span>
        </div>
      </motion.header>

      {/* Info Ticker (What NETRA Does) */}
      <motion.section 
        className="mb-10 cyber-glass border-slate-800/80 p-5 rounded-lg flex items-start gap-4"
        variants={itemVariants}
      >
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed text-left">
          <p className="text-cyan-400 font-extrabold uppercase tracking-wider mb-1 text-xs">Mission Intelligence</p>
          <p className="text-slate-200 font-medium">
            NETRA provides digital forensics tracing to protect personal privacy. We scan deep web archives, reverse image engines, and search indexes to locate visual evidence leaks and collect source URLs, empowering victims to reclaim control over their data.
          </p>
        </div>
      </motion.section>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
        {/* Start Investigation Card */}
        <motion.div 
          onClick={() => navigateTo('investigation')}
          variants={itemVariants}
          whileHover={{ 
            y: -6, 
            scale: 1.015,
            borderColor: "rgba(16, 185, 129, 0.4)",
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.1)"
          }}
          whileTap={{ scale: 0.985 }}
          className="cyber-glass cursor-pointer p-8 rounded-xl flex flex-col items-center justify-between text-center transition-all duration-300 group"
        >
          <div className="p-4 bg-emerald-400/5 border border-emerald-400/20 rounded-full mb-6 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-wide mb-3 text-white group-hover:text-emerald-400 transition-colors">
              START SCAN
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Upload screenshot, image, or forensic evidence. Deploy digital search agents to locate index matches.
            </p>
          </div>
          <span className="mt-8 text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase group-hover:underline">
            Initialize Scan &gt;
          </span>
        </motion.div>

        {/* Previous Cases Card */}
        <motion.div 
          onClick={() => navigateTo('cases')}
          variants={itemVariants}
          whileHover={{ 
            y: -6, 
            scale: 1.015,
            borderColor: "rgba(2, 132, 199, 0.4)",
            boxShadow: "0 10px 30px rgba(2, 132, 199, 0.1)"
          }}
          whileTap={{ scale: 0.985 }}
          className="cyber-glass cursor-pointer p-8 rounded-xl flex flex-col items-center justify-between text-center transition-all duration-300 group"
        >
          <div className="p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-full mb-6 group-hover:scale-105 transition-transform">
            <History className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-wide mb-3 text-white group-hover:text-cyan-400 transition-colors">
              CASE ARCHIVE
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Browse previous digital scans. Check matching logs, timeline evidence, and tracking outcomes.
            </p>
          </div>
          <span className="mt-8 text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase group-hover:underline">
            Load Archive &gt;
          </span>
        </motion.div>

        {/* Reports Card */}
        <motion.div 
          onClick={() => navigateTo('reports')}
          variants={itemVariants}
          whileHover={{ 
            y: -6, 
            scale: 1.015,
            borderColor: "rgba(139, 92, 246, 0.4)",
            boxShadow: "0 10px 30px rgba(139, 92, 246, 0.1)"
          }}
          whileTap={{ scale: 0.985 }}
          className="cyber-glass cursor-pointer p-8 rounded-xl flex flex-col items-center justify-between text-center transition-all duration-300 group"
        >
          <div className="p-4 bg-purple-400/5 border border-purple-400/20 rounded-full mb-6 group-hover:scale-105 transition-transform">
            <FileBarChart className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-wide mb-3 text-white group-hover:text-purple-400 transition-colors">
              REPORTS
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Export comprehensive forensic files. Generate PDF documents for legal submissions or takedowns.
            </p>
          </div>
          <span className="mt-8 text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase group-hover:underline">
            Generate Exports &gt;
          </span>
        </motion.div>
      </div>

      {/* Real-time stats ticker at the bottom */}
      <motion.footer 
        className="mt-auto pt-8 border-t border-slate-800/80 flex flex-wrap gap-6 justify-around text-center text-xs font-mono text-slate-300"
        variants={itemVariants}
      >
        <div>
          <span className="block text-lg font-extrabold text-cyan-400">{stats.totalCases}</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Total Scans Run</span>
        </div>
        <div className="border-l border-slate-800/80 px-6">
          <span className="block text-lg font-extrabold text-emerald-400">{stats.totalFindings}</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Leaks Tracked</span>
        </div>
        <div className="border-l border-slate-800/80 px-6">
          <span className="block text-lg font-extrabold text-amber-400">{stats.activeCases}</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Active Deployments</span>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default HomePage;
