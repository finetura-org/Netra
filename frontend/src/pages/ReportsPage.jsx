import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, FileText, Download, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../api/client';

const ReportsPage = ({ navigateTo }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingCaseId, setExportingCaseId] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cases');
      // Only show completed cases for reports since failed/processing cases don't have reports
      const completed = (response.data || []).filter(c => c.status === 'completed');
      setCases(completed);
      setError(null);
    } catch (err) {
      console.error("Error loading reports cases:", err);
      setError("Failed to sync reports archive database.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCases = () => {
    if (!searchQuery) return cases;
    const q = searchQuery.toLowerCase();
    return cases.filter(c => 
      c.original_filename?.toLowerCase().includes(q) || 
      c.case_id?.toLowerCase().includes(q)
    );
  };

  const handleExportPDF = async (caseId) => {
    setExportingCaseId(caseId);
    try {
      // Fetch full case details (findings + AI summary)
      const res = await api.get(`/cases/${caseId}`);
      const caseData = res.data;

      // Initialize PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header Banner
      doc.setFillColor(3, 7, 18);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(0, 191, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('NETRA', 20, 28);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Network Enabled Tracking and Reconnaissance Analysis Report', 20, 37);

      doc.setTextColor(0, 255, 170);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, 28, { align: 'right' });
      doc.text(`Case ID: ${caseData.case_id || 'N/A'}`, pageWidth - 20, 37, { align: 'right' });

      y = 55;

      // Divider
      doc.setDrawColor(0, 191, 255);
      doc.setLineWidth(0.5);
      doc.line(20, y, pageWidth - 20, y);
      y += 15;

      // Case Info Table
      doc.setTextColor(0, 191, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Case Summary details', 20, y);
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

      // Findings List
      const findings = caseData.findings || [];
      doc.setTextColor(0, 191, 255);
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
          if (conf >= 70) doc.setTextColor(0, 180, 100);
          else if (conf >= 40) doc.setTextColor(220, 140, 0);
          else doc.setTextColor(220, 50, 50);
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

      // AI Summary
      const aiSummary = caseData.ai_summary || caseData.summary;
      if (aiSummary) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(0, 191, 255);
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

      // Add Page numbers
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
      console.error("PDF download failure:", err);
    } finally {
      setExportingCaseId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-cyber-purple border-cyber-blue/20 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-slate-400 tracking-wider">COMPILING REPORTS DATA ARCHIVE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8 cyber-glass rounded-xl">
        <ShieldAlert className="w-12 h-12 text-cyber-red mx-auto mb-4" />
        <p className="text-sm font-mono text-cyber-red mb-6">{error}</p>
        <button onClick={() => navigateTo('home')} className="electric-btn px-6 py-3 rounded-lg">
          RETURN TO CORE CONSOLE
        </button>
      </div>
    );
  }

  const filteredReports = getFilteredCases();

  return (
    <div className="w-full flex flex-col min-h-[85vh]">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-cyber-blue/15 pb-6 mb-8 text-left">
        <button 
          onClick={() => navigateTo('home')}
          className="p-2 border border-cyber-blue/20 hover:border-cyber-blue/50 hover:bg-cyber-blue/10 rounded-lg text-cyber-blue transition-all cursor-pointer"
          title="Back to Console"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-orbitron tracking-wider text-white">
            FORENSIC DOSSIERS & REPORTS
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
            Download certified digital forensic summary sheets
          </p>
        </div>
      </header>

      {/* Search Input */}
      <div className="cyber-glass rounded-xl p-4 mb-6 text-left">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by case ID or file name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02050b] border border-cyber-blue/20 text-xs rounded-lg py-2.5 pl-9 pr-4 text-slate-200 focus:outline-none focus:border-cyber-blue font-mono"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length > 0 ? (
        <div className="space-y-4 text-left">
          {filteredReports.map((report) => (
            <div 
              key={report.case_id}
              className="cyber-glass-purple rounded-xl p-5 hover:border-cyber-purple/40 hover:bg-cyber-purple/5 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-cyber-purple/10"
            >
              <div>
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">
                  {report.case_id}
                </span>
                <h3 className="text-base font-bold text-slate-200 font-orbitron mt-1 truncate max-w-sm sm:max-w-md">
                  {report.original_filename}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-mono mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyber-purple" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>Matches: <strong className="text-cyber-green">{report.findings_count} Links</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Sparkles className="w-3.5 h-3.5 text-cyber-purple" /> EXIF Sanity Cleansed</span>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                <button
                  onClick={() => navigateTo('results', report.case_id)}
                  className="px-4 py-2 bg-cyber-bg-dark border border-cyber-purple/35 hover:border-cyber-purple text-cyber-purple text-xs font-mono rounded-lg transition-colors cursor-pointer w-full sm:w-auto text-center"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleExportPDF(report.case_id)}
                  disabled={exportingCaseId === report.case_id}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-cyber-purple/15 hover:bg-cyber-purple/30 border border-cyber-purple/50 text-white text-xs font-mono rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" /> 
                  {exportingCaseId === report.case_id ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-cyber-blue/10 rounded-xl bg-cyber-bg-dark/10 my-auto">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-500">NO COMPLETED SCANS IN THE DOSSIER DATABASE</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
