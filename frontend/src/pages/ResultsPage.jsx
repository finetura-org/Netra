import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Eye, ExternalLink, Calendar, Hash, ShieldAlert, 
  Brain, FileText, CheckCircle2, Copy, Search, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../api/client';
import NeuronGraph from '../components/NeuronGraph';

const ResultsPage = ({ caseId, navigateTo }) => {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('All');
  const [sortBy, setSortBy] = useState('confidence-desc');
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState('select');

  useEffect(() => {
    if (!caseId) return;
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cases/${caseId}`);
      setCaseData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error loading case details:", err);
      setError("Failed to load case results database archive.");
    } finally {
      setLoading(false);
    }
  };

  const copyHash = () => {
    if (caseData?.phash) {
      navigator.clipboard.writeText(caseData.phash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getImageUrl = () => {
    if (!caseData?.clean_image_path) return null;
    const filename = caseData.clean_image_path.split(/[/\\]/).pop();
    return `http://localhost:8000/uploads/clean/${filename}`;
  };

  const getFilteredFindings = () => {
    if (!caseData?.findings) return [];
    
    let list = [...caseData.findings];
    
    // Filter by provider
    if (providerFilter !== 'All') {
      list = list.filter(f => f.source_provider?.toLowerCase() === providerFilter.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(f => 
        (f.source_url && f.source_url.toLowerCase().includes(query)) ||
        (f.page_title && f.page_title.toLowerCase().includes(query)) ||
        (f.domain && f.domain.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === 'confidence-desc') {
      list.sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === 'confidence-asc') {
      list.sort((a, b) => a.confidence - b.confidence);
    } else if (sortBy === 'similarity-desc') {
      list.sort((a, b) => b.similarity_score - a.similarity_score);
    }

    return list;
  };

  const handleExportPDF = async () => {
    if (!caseData) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header Banner
      doc.setFillColor(3, 7, 18);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(2, 132, 199);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('NETRA', 20, 28);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Network Enabled Tracking and Reconnaissance Analysis Report', 20, 37);

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, 28, { align: 'right' });
      doc.text(`Case ID: ${caseData.case_id || 'N/A'}`, pageWidth - 20, 37, { align: 'right' });

      y = 55;

      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(0.5);
      doc.line(20, y, pageWidth - 20, y);
      y += 15;

      doc.setTextColor(2, 132, 199);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Case Summary Details', 20, y);
      y += 10;

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const infoRows = [
        ['Original File', caseData.original_filename || 'N/A'],
        ['Sanitized Hash (pHash)', caseData.phash || 'N/A'],
        ['Created Timestamp', new Date(caseData.created_at).toLocaleString()],
        ['Leaks Identified', String(caseData.findings?.length || 0)],
      ];

      infoRows.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${lbl}:`, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(val, 75, y);
        y += 7;
      });

      y += 10;

      const findings = caseData.findings || [];
      doc.setTextColor(2, 132, 199);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Identified Visual Matches (${findings.length})`, 20, y);
      y += 10;

      if (findings.length > 0) {
        doc.setFillColor(240, 245, 255);
        doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('MATCH LINK', 22, y);
        doc.text('DOMAIN', 95, y);
        doc.text('CONFIDENCE', 140, y);
        doc.text('PROVIDER', 165, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);

        findings.forEach((finding) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const url = finding.source_url || 'N/A';
          const displayUrl = url.length > 40 ? url.substring(0, 40) + '...' : url;
          doc.setFontSize(7);
          doc.setTextColor(0, 102, 204);
          doc.text(displayUrl, 22, y);
          doc.link(20, y - 4, 70, 5, { url });
          
          doc.setTextColor(70, 70, 70);
          doc.text(finding.domain || 'N/A', 95, y);
          
          const conf = Math.round(finding.confidence || 0);
          if (conf >= 70) doc.setTextColor(16, 185, 129);
          else if (conf >= 40) doc.setTextColor(245, 158, 11);
          else doc.setTextColor(239, 68, 68);
          doc.text(`${conf}%`, 140, y);
          
          doc.setTextColor(70, 70, 70);
          doc.text(finding.source_provider || 'N/A', 165, y);
          y += 6;
        });
      } else {
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(10);
        doc.text('No visual leaks detected in deep indices.', 20, y);
        y += 10;
      }

      y += 15;

      const aiSummary = caseData.ai_summary || caseData.summary;
      if (aiSummary) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(2, 132, 199);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Forensics AI Analysis Summary', 20, y);
        y += 10;

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(aiSummary, pageWidth - 40);
        splitText.forEach(line => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 5;
        });
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(
          `NETRA digital forensics case export — Page ${i} of ${totalPages}`,
          pageWidth / 2, doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`NETRA_Forensics_${caseData.case_id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!caseData) return;
    const json = JSON.stringify(caseData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NETRA_Case_${caseData.case_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!caseData?.findings) return;
    const headers = 'ID,URL,Domain,Similarity,Confidence,Provider,Found At\n';
    const rows = caseData.findings.map((f, i) => 
      `${i + 1},"${f.source_url}","${f.domain}",${f.similarity_score},${f.confidence},"${f.source_provider}","${f.found_at}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NETRA_Case_${caseData.case_id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-cyber-blue border-cyber-green/20 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-xs text-slate-400 tracking-wider font-bold">LOADING CASE DETAILED ANALYSIS FILES...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8 cyber-glass rounded-xl border border-slate-800">
        <ShieldAlert className="w-12 h-12 text-cyber-red mx-auto mb-4" />
        <p className="text-sm font-mono text-cyber-red mb-6">{error || "Case result coordinates missing"}</p>
        <button onClick={() => navigateTo('home')} className="formal-btn px-6 py-3 rounded-lg cursor-pointer">
          RETURN TO CORE CONSOLE
        </button>
      </div>
    );
  }

  const allFindings = caseData.findings || [];
  const filteredFindings = getFilteredFindings();

  // Statistics calculation for Dashboard Summary widgets
  const totalFindingsCount = allFindings.length;
  const highConfidenceCount = allFindings.filter(f => f.confidence >= 70).length;
  const uniqueDomains = new Set(allFindings.map(f => f.domain).filter(Boolean)).size;

  // Stagger configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  if (viewMode === 'select') {
    return (
      <motion.div 
        key="select"
        className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[75vh]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center mb-10 max-w-xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            <Brain className="w-8 h-8 text-cyan-400 animate-pulse" />
          </motion.div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase mb-2">
            Select Analysis Presentation
          </h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Choose visual framework for Case <span className="text-cyan-400 font-bold">#{caseData.case_id}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Card 1: Neuron Graph */}
          <motion.div
            whileHover={{ y: -6, borderColor: "rgba(34, 211, 238, 0.4)", backgroundColor: "rgba(5, 8, 20, 0.65)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('neuron')}
            className="cyber-glass border border-slate-800 p-8 rounded-2xl cursor-pointer text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase group-hover:text-cyan-300 transition-colors">Neuron Graph</h3>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                Render an interactive, neural physics network representation of findings. Synaptic branches connect the target seed to source threat intelligence URLs.
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                LAUNCH GRAPH VIEW <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {caseData.findings?.length || 0} Synapses
              </span>
            </div>
          </motion.div>

          {/* Card 2: Formal Case Results */}
          <motion.div
            whileHover={{ y: -6, borderColor: "rgba(16, 185, 129, 0.4)", backgroundColor: "rgba(5, 8, 20, 0.65)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('formal')}
            className="cyber-glass border border-slate-800 p-8 rounded-2xl cursor-pointer text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase group-hover:text-emerald-300 transition-colors">Formal Ledger</h3>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                Access a corporate-grade, structured intelligence database. Filter findings by provider, perform instant keyword searches, and compile exported summaries.
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                ENTER LEDGER VIEW <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Tabular Grid
              </span>
            </div>
          </motion.div>
        </div>

        <button 
          onClick={() => navigateTo('home')}
          className="mt-12 text-[10px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return to Console
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key={viewMode}
      className="w-full flex flex-col min-h-[85vh]"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
      }}
    >
      {/* Top Header */}
      <motion.header 
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <motion.button 
            onClick={() => setViewMode('select')}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 border border-slate-850 hover:border-slate-750 hover:bg-[#070b19] rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Change Presentation View"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="text-left">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase">
              Case Results
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
              CASE REFERENCE: <span className="text-cyan-400 font-bold">{caseData.case_id}</span>
            </p>
          </div>
        </div>

        {/* Action Button Exports & Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle View Mode Button */}
          <motion.button 
            onClick={() => setViewMode(viewMode === 'formal' ? 'neuron' : 'formal')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs rounded-lg font-bold transition-all cursor-pointer border-0 shadow-lg text-white ${
              viewMode === 'formal'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-650 shadow-cyan-500/10'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-650 shadow-emerald-500/10'
            }`}
          >
            {viewMode === 'formal' ? (
              <>
                <Brain className="w-4 h-4 animate-pulse" /> SWITCH TO NEURON VIEW 🧠
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" /> SWITCH TO FORMAL VIEW 📊
              </>
            )}
          </motion.button>

          <span className="text-slate-800 hidden sm:inline mx-1">|</span>

          <motion.button 
            onClick={handleExportPDF}
            disabled={exporting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs rounded-lg border-0 shadow-md font-bold transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" /> 
            {exporting ? 'Exporting PDF...' : 'Download PDF Report'}
          </motion.button>
          <motion.button 
            onClick={handleExportJSON}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs rounded-lg border-0 shadow-md font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export JSON
          </motion.button>
          <motion.button 
            onClick={handleExportCSV}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-mono text-xs rounded-lg border-0 shadow-md font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> CSV
          </motion.button>
        </div>
      </motion.header>

      {viewMode === 'neuron' ? (
        <div className="w-full flex flex-col gap-6 text-left">
          {/* High-End Stats Row (Dashboard Style Widgets) */}
          <motion.div className="grid grid-cols-3 gap-4" variants={itemVariants}>
            <motion.div 
              className="cyber-glass rounded-xl p-4 border border-slate-800/90"
              whileHover={{ y: -2 }}
            >
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Total Leaks</span>
              <span className="text-2xl font-black text-white">{totalFindingsCount}</span>
            </motion.div>
            
            <motion.div 
              className="cyber-glass rounded-xl p-4 border border-slate-800/90"
              whileHover={{ y: -2 }}
            >
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">High Threat</span>
              <span className={`text-2xl font-black ${highConfidenceCount > 0 ? 'text-cyber-red' : 'text-slate-400'}`}>
                {highConfidenceCount}
              </span>
            </motion.div>

            <motion.div 
              className="cyber-glass rounded-xl p-4 border border-slate-800/90"
              whileHover={{ y: -2 }}
            >
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">compromised domains</span>
              <span className="text-2xl font-black text-cyan-400">{uniqueDomains}</span>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="w-full flex-1"
          >
            <NeuronGraph findings={allFindings} imageUrl={getImageUrl()} />
          </motion.div>
        </div>
      ) : (
        /* Main Grid Layout for Formal Ledger */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Sample Viewer & Ingestion Metadata */}
          <div className="lg:col-span-1 flex flex-col gap-6 text-left">
            
            {/* Sample Card */}
            <motion.div 
              className="cyber-glass rounded-xl p-5 border border-slate-800/90"
              variants={itemVariants}
            >
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Ingested Sample</h3>
              
              <div className="w-full aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-850 flex items-center justify-center relative mb-4">
                {getImageUrl() ? (
                  <img 
                    src={getImageUrl()} 
                    alt="Source File" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-600 font-mono">IMAGE NOT LOCATABLE</span>
                )}
              </div>

              {/* Metadata Fields */}
              <div className="space-y-3 font-mono text-[11px] text-slate-300 border-t border-slate-800/80 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">FILENAME:</span>
                  <span className="text-white font-bold truncate max-w-[150px]">{caseData.original_filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">INGEST TIMESTAMP:</span>
                  <span>{new Date(caseData.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">PERCEPTUAL HASH:</span>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-cyan-400 font-bold truncate max-w-[100px]">{caseData.phash || 'N/A'}</span>
                    <motion.button 
                      onClick={copyHash}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 border border-slate-800 hover:border-cyan-500/30 rounded text-slate-400 hover:text-cyan-400 cursor-pointer shrink-0 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI forensics synthesis */}
            {((caseData.ai_summary && caseData.ai_summary.length > 5) || (caseData.summary && caseData.summary.length > 5)) && (
              <motion.div 
                className="cyber-glass rounded-xl p-5 border border-slate-800/90 flex flex-col"
                variants={itemVariants}
              >
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyan-400" /> AI Forensics Summary
                </h3>
                <div className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap max-h-80 overflow-y-auto pr-1">
                  {caseData.ai_summary || caseData.summary}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: High-End Statistics + Filters + Results Grid */}
          <div className="lg:col-span-2 flex flex-col gap-6 text-left">
            
            {/* High-End Stats Row (Dashboard Style Widgets) */}
            <motion.div className="grid grid-cols-3 gap-4" variants={itemVariants}>
              <motion.div 
                className="cyber-glass rounded-xl p-4 border border-slate-800/90"
                whileHover={{ y: -2 }}
              >
                <span className="text-[10px] font-mono text-slate-550 uppercase block mb-1">Total Leaks</span>
                <span className="text-2xl font-black text-white">{totalFindingsCount}</span>
              </motion.div>
              
              <motion.div 
                className="cyber-glass rounded-xl p-4 border border-slate-800/90"
                whileHover={{ y: -2 }}
              >
                <span className="text-[10px] font-mono text-slate-550 uppercase block mb-1">High Threat</span>
                <span className={`text-2xl font-black ${highConfidenceCount > 0 ? 'text-cyber-red' : 'text-slate-400'}`}>
                  {highConfidenceCount}
                </span>
              </motion.div>

              <motion.div 
                className="cyber-glass rounded-xl p-4 border border-slate-800/90"
                whileHover={{ y: -2 }}
              >
                <span className="text-[10px] font-mono text-slate-555 uppercase block mb-1">compromised domains</span>
                <span className="text-2xl font-black text-cyan-400">{uniqueDomains}</span>
              </motion.div>
            </motion.div>

            {/* Filters Control Bar */}
            <motion.div className="cyber-glass rounded-xl p-4 border border-slate-800/90 flex flex-col md:flex-row gap-4 items-center justify-between" variants={itemVariants}>
              {/* Search */}
              <div className="w-full md:w-60 relative">
                <Search className="w-4 h-4 text-slate-505 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search matching link..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg py-2 pl-9 pr-4 text-slate-202 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              {/* Provider Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-950 border border-slate-850 p-1 rounded-lg">
                {['All', 'google_lens', 'tineye', 'bing_visual'].map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setProviderFilter(prov)}
                    className={`px-3 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors uppercase ${
                      providerFilter === prov 
                        ? 'bg-cyber-blue/15 text-cyan-400 border border-cyber-blue/30 font-bold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {prov.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="w-full md:w-auto flex items-center gap-2 border-l border-slate-800/90 pl-4 shrink-0">
                <span className="text-[10px] font-mono text-slate-505 uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-[10px] font-mono rounded py-1 px-2 text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="confidence-desc">CONFIDENCE DESC</option>
                  <option value="confidence-asc">CONFIDENCE ASC</option>
                  <option value="similarity-desc">SIMILARITY DESC</option>
                </select>
              </div>
            </motion.div>

            {/* Results Grid List with Smooth AnimatePresence list transitions */}
            <motion.div 
              className="space-y-4 max-h-[50vh] overflow-y-auto pr-2"
              variants={containerVariants}
            >
              <AnimatePresence mode="popLayout">
                {filteredFindings.length > 0 ? (
                  filteredFindings.map((finding) => {
                    const conf = Math.round(finding.confidence || 0);
                    const sim = Math.round(finding.similarity_score || 0);
                    
                    const confColor = conf >= 70 
                      ? 'text-cyber-green border-emerald-500/20 bg-emerald-500/5' 
                      : conf >= 40 
                      ? 'text-cyber-yellow border-amber-500/20 bg-amber-500/5' 
                      : 'text-cyber-red border-red-500/20 bg-red-500/5';

                    return (
                      <motion.div 
                        key={finding.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ 
                          y: -3, 
                          borderColor: "rgba(2, 132, 199, 0.35)",
                          backgroundColor: "rgba(7, 11, 25, 0.45)"
                        }}
                        className="cyber-glass rounded-xl p-4 border border-slate-800/90 hover:bg-[#070b19]/30 transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="text-left flex-1 min-w-0">
                          {/* Provider Header */}
                          <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-[10px]">
                            <span className="text-cyan-400 uppercase font-bold">
                              {finding.source_provider?.replace('_', ' ')}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 truncate max-w-[150px]">
                              {finding.domain}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-550">
                              {new Date(finding.found_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* URL Page Title */}
                          <p className="text-xs font-bold text-slate-101 truncate mb-1" title={finding.page_title || finding.source_url}>
                            {finding.page_title || "Visual Match Target Link"}
                          </p>
                          
                          <a 
                            href={finding.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-cyan-400 hover:text-emerald-400 flex items-center gap-1 select-text break-all"
                          >
                            {finding.source_url} <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>

                        {/* Meters */}
                        <div className="flex gap-4 shrink-0 w-full sm:w-auto font-mono text-[10px]">
                          <div className="text-center bg-slate-950 p-2 border border-slate-850 rounded-lg min-w-[70px]">
                            <span className="block text-slate-505 text-[8px] uppercase">Similarity</span>
                            <span className="block text-cyan-400 font-bold text-xs mt-0.5">{sim}%</span>
                          </div>
                          
                          <div className={`text-center p-2 border rounded-lg min-w-[70px] ${confColor}`}>
                            <span className="block text-slate-505 text-[8px] uppercase">Confidence</span>
                            <span className="block font-bold text-xs mt-0.5">{conf}%</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 flex flex-col items-center justify-center p-6"
                  >
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                    <p className="text-sm font-semibold text-slate-300 font-mono mb-2">No Visual Matches in Case Database</p>
                    <p className="text-xs text-slate-505 max-w-sm font-mono leading-relaxed">
                      The backend server is running the old cached scraper pipeline in memory. 
                      Please **restart the backend server** (close the command terminal and double-click <strong>start_Backend.bat</strong>) to load the mock results.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsPage;
