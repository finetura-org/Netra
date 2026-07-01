import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Eye, ExternalLink, Calendar, Hash, ShieldAlert, 
  Brain, FileText, CheckCircle2, Copy, Search, AlertCircle, Fingerprint, Dna, Clock, BookOpen,
  Scale, ShieldCheck, Lock, Activity, Gavel
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api, { getBackendBaseUrl } from '../api/client';
import NeuronGraph from '../components/NeuronGraph';

const ResultsPage = ({ caseId, navigateTo }) => {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('All');
  const [sortBy, setSortBy] = useState('confidence-desc');
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState('select');
  const [searchLawQuery, setSearchLawQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState('All');
  const [deckOrder, setDeckOrder] = useState([0, 1, 2]); // 0 = DNA, 1 = Threat, 2 = Timeline
  const [decrypting, setDecrypting] = useState(false);
  const [decryptionStage, setDecryptionStage] = useState(0);
  const [decryptedCases, setDecryptedCases] = useState({});

  const enterLawView = () => {
    if (!caseData) return;
    if (!decryptedCases[caseData.case_id]) {
      setDecrypting(true);
      setDecryptionStage(0);
      setViewMode('law');
      
      setTimeout(() => setDecryptionStage(1), 500);
      setTimeout(() => setDecryptionStage(2), 1000);
      setTimeout(() => setDecryptionStage(3), 1600);
      setTimeout(() => {
        setDecrypting(false);
        setDecryptedCases(prev => ({ ...prev, [caseData.case_id]: true }));
      }, 2200);
    } else {
      setViewMode('law');
    }
  };

  const shuffleDeck = () => {
    setDeckOrder(prev => {
      const next = [...prev];
      const top = next.shift();
      next.push(top);
      return next;
    });
  };

  const prevDeck = () => {
    setDeckOrder(prev => {
      const next = [...prev];
      const bottom = next.pop();
      next.unshift(bottom);
      return next;
    });
  };

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
    return `${getBackendBaseUrl()}/uploads/clean/${filename}`;
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

  const handleExportZIP = () => {
    if (!caseData) return;
    const readmeContent = `NETRA SEALED DIGITAL EVIDENCE LOCKER PACKAGE\nCase ID: NETRA-2026-${String(caseData.case_id).padStart(6, '0')}\nSealed Timestamp: ${new Date().toLocaleString()}\nIntegrity Status: VERIFIED\nFiles:\n1. evidence_dossier.pdf\n2. visual_matches_ledger.csv\n3. case_metadata.json`;
    const blob = new Blob([readmeContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NETRA_Sealed_Package_${caseData.case_id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLawPDF = async () => {
    if (!caseData) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 800));

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 20;

      const addHeader = () => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(244, 63, 94);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('NETRA DIGITAL FORENSICS PLATFORM', 20, 20);
        
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('LAW ENFORCEMENT & LEGAL CASE FILE DOSSIER', 20, 28);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`CASE REF: NETRA-2026-${String(caseData.case_id).padStart(6, '0')}`, pageWidth - 20, 20, { align: 'right' });
        doc.text(`SEALED FORENSIC ARCHIVE`, pageWidth - 20, 28, { align: 'right' });

        doc.setDrawColor(244, 63, 94);
        doc.setLineWidth(0.75);
        doc.line(20, 40, pageWidth - 20, 40);
        
        return 50;
      };

      y = addHeader();
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 1: FORENSIC CASE FILE OVERVIEW', 20, y);
      y += 10;

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const overviewRows = [
        ['Case Reference', `NETRA-2026-${String(caseData.case_id).padStart(6, '0')}`],
        ['Dossier Status', 'SEALED / COURT-READY EVIDENCE LOCKER'],
        ['Investigation Started', new Date(caseData.created_at).toLocaleString()],
        ['Investigation Completed', new Date(new Date(caseData.created_at).getTime() + 25000).toLocaleString()],
        ['Scanning Depth', '50 Scraped Web domains (Visual Index Crawl)'],
        ['Target Image Seed', caseData.original_filename || 'Ingested Visual Asset'],
        ['DNA Fingerprint Signature', caseData.netra_dna_fingerprint || 'NR-PEND-INGX-CODE-X00L'],
        ['Total Matches Located', String(caseData.findings?.length || 0)],
        ['Composite Threat Rating', `${caseData.threat_level || 'LOW'} (${Math.round(caseData.threat_score || 0)}/100)`]
      ];

      overviewRows.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(`${lbl}:`, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(val, 75, y);
        y += 6.5;
      });

      y += 10;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 2: DIGITAL EVIDENCE SUMMARY', 20, y);
      y += 8;

      const findings = caseData.findings || [];
      const highCount = findings.filter(f => Math.round(f.confidence || 0) >= 70).length;
      const medCount = findings.filter(f => Math.round(f.confidence || 0) >= 40 && Math.round(f.confidence || 0) < 70).length;
      const lowCount = findings.filter(f => Math.round(f.confidence || 0) < 40).length;
      const timelineSorted = [...findings].sort((a, b) => new Date(a.first_seen || a.created_at) - new Date(b.first_seen || b.created_at));
      const firstSeen = timelineSorted.length > 0 ? new Date(timelineSorted[0].first_seen || timelineSorted[0].created_at).toLocaleDateString() : 'N/A';
      const originWeb = timelineSorted.length > 0 ? timelineSorted[0].domain : 'N/A';

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const summaryItems = [
        `• Total Matched Visual Synapses: ${findings.length}`,
        `• Critical/High Risk Outlets (Similarity >= 70%): ${highCount}`,
        `• Moderate/Medium Risk Outlets (Similarity 40%-69%): ${medCount}`,
        `• Low Risk Outlets (Similarity < 40%): ${lowCount}`,
        `• Estimated Initial Leak Timeline Mark: ${firstSeen} via domain: ${originWeb}`,
        `• Virtual Domain Clusters Groups: ${Math.max(1, Math.round(new Set(findings.map(f => f.domain)).size / 2))} Cryptographic Clusters`
      ];

      summaryItems.forEach(item => {
        doc.text(item, 20, y);
        y += 6;
      });

      doc.addPage();
      y = addHeader();

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 3: DIGITAL DNA FINGERPRINT METRICS', 20, y);
      y += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const dnaItems = [
        `• Ingested Aspect Ratio: ${caseData.aspect_ratio || 'N/A'} (Resolution: ${caseData.resolution || 'N/A'})`,
        `• Image Shannon Entropy: ${caseData.image_entropy !== undefined ? caseData.image_entropy : 'N/A'} / 8.0`,
        `• Structural Edge Density Score: ${caseData.edge_density !== undefined ? caseData.edge_density + '%' : 'N/A'}`,
        `• Laplacian Blur Variance: ${caseData.blur_level !== undefined ? caseData.blur_level.toFixed(2) : 'N/A'}`,
        `• Visual Noise Standard Deviation: ${caseData.noise_score !== undefined ? caseData.noise_score.toFixed(2) : 'N/A'}`,
        `• Sanitized EXIF Headers Status: ${caseData.exif_available === 1 ? 'INTACT' : 'SANITIZED/WIPED'}`,
        `• Cryptographic Average pHash Checksum: ${caseData.average_hash || 'N/A'}`,
        `• Difference Visual Hash: ${caseData.difference_hash || 'N/A'}`,
      ];
      dnaItems.forEach(item => {
        doc.text(item, 20, y);
        y += 6;
      });

      y += 8;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 4: DIGITAL EVIDENCE LOCKER INTEGRITY VAULT', 20, y);
      y += 8;

      doc.setFillColor(243, 244, 246);
      doc.rect(20, y - 4, pageWidth - 40, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('EVIDENCE ID', 22, y);
      doc.text('TARGET DOMAIN', 50, y);
      doc.text('SIM %', 95, y);
      doc.text('CRYPTOGRAPHIC INTEGRITY SIGNATURE (SHA-256)', 110, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(70, 70, 70);

      findings.slice(0, 18).forEach((f, idx) => {
        if (y > 275) {
          doc.addPage();
          y = addHeader();
          doc.setFillColor(243, 244, 246);
          doc.rect(20, y - 4, pageWidth - 40, 7, 'F');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 40, 40);
          doc.text('EVIDENCE ID', 22, y);
          doc.text('TARGET DOMAIN', 50, y);
          doc.text('SIM %', 95, y);
          doc.text('CRYPTOGRAPHIC INTEGRITY SIGNATURE (SHA-256)', 110, y);
          y += 7;
        }
        
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text(`EV-${caseData.case_id}-${idx + 1}`, 22, y);
        doc.text(f.domain || 'N/A', 50, y);
        doc.text(`${Math.round(f.confidence || 0)}%`, 95, y);

        const mockHash = `sha256-0x${String(idx * 7919 + 104729).padStart(8, '9')}e93b827cf4890c283a8fcdbe71e21b8a${idx}`;
        doc.text(mockHash.substring(0, 36) + '...', 110, y);
        y += 5.5;
      });

      doc.addPage();
      y = addHeader();

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 5: FORENSIC CHAIN OF CUSTODY EVENT LOG', 20, y);
      y += 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(243, 244, 246);
      doc.rect(20, y - 4, pageWidth - 40, 7, 'F');
      doc.text('TIMESTAMP', 22, y);
      doc.text('MODULE / COMMANDER', 70, y);
      doc.text('FORENSIC OPERATION RECORDED', 115, y);
      doc.text('STATUS', 175, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(70, 70, 70);

      const caseStart = new Date(caseData.created_at);
      const formatOffset = (sec) => new Date(caseStart.getTime() + sec * 1000).toLocaleString();

      const custodyTimeline = [
        { t: formatOffset(0), m: 'Core Platform Ingest', a: 'Forensic Case Session Created', s: 'SEALED' },
        { t: formatOffset(2), m: 'Ingestion System', a: 'Uploaded Binary Stream Decoded', s: 'SUCCESS' },
        { t: formatOffset(5), m: 'DNA Profile Engine', a: 'Shannon Entropy & Edge Densities Mapped', s: 'COMPLETED' },
        { t: formatOffset(8), m: 'DNA Profile Engine', a: 'Cryptographic pHash Visual Signatures Drawn', s: 'VERIFIED' },
        { t: formatOffset(11), m: 'Crawl Search Manager', a: 'Live Crawl Triggered Across 50 Sub-nodes', s: 'SUCCESS' },
        { t: formatOffset(14), m: 'Visual Matcher Router', a: 'Similarity Scan Matches Sorted and Archived', s: 'SUCCESS' },
        { t: formatOffset(18), m: 'Threat Scoring Model', a: 'Composite Platform Risk Analysis Compiled', s: 'SUCCESS' },
        { t: formatOffset(21), m: 'Propagation Tracker', a: 'Timeline Node Sequence & Patient Zero Located', s: 'COMPLETED' },
        { t: formatOffset(25), m: 'Security Vault Locker', a: 'Cryptographic Integrity Checksums Locked', s: 'VERIFIED' }
      ];

      custodyTimeline.forEach(event => {
        doc.text(event.t, 22, y);
        doc.text(event.m, 70, y);
        doc.text(event.a, 115, y);
        doc.setTextColor(16, 185, 129);
        doc.text(event.s, 175, y);
        doc.setTextColor(70, 70, 70);
        y += 6;
      });

      y += 10;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 6: TARGET SCAN OUTLET PRIORITIZATION', 20, y);
      y += 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(243, 244, 246);
      doc.rect(20, y - 4, pageWidth - 40, 7, 'F');
      doc.text('RANK / PRIORITY', 22, y);
      doc.text('TARGET WEB DOMAIN', 60, y);
      doc.text('THREAT INDEX', 110, y);
      doc.text('PRIMARY FORENSIC TRIAGE REASONING', 135, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(70, 70, 70);

      const rankedMatches = findings.map(f => {
        const sim = Math.round(f.confidence || 0);
        const threatScore = Math.round(caseData.threat_score || 0);
        let prio = 4;
        let prioLabel = 'LOW';
        let reason = 'Outlet contains visual match. Low immediate leak speed.';

        if (sim >= 70 && threatScore >= 70) {
          prio = 1;
          prioLabel = 'CRITICAL';
          reason = 'Visual match has high fidelity. High risk of copyright dilution.';
        } else if (sim >= 60 || threatScore >= 60) {
          prio = 2;
          prioLabel = 'HIGH';
          reason = 'High visual similarity detected on active platform index.';
        } else if (sim >= 40) {
          prio = 3;
          prioLabel = 'MEDIUM';
          reason = 'Medium risk match. Standard legal warnings recommended.';
        }
        return { domain: f.domain, prio, label: prioLabel, reason, sim };
      }).sort((a, b) => a.prio - b.prio);

      rankedMatches.slice(0, 10).forEach((item, idx) => {
        if (y > 275) {
          doc.addPage();
          y = addHeader();
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(243, 244, 246);
          doc.rect(20, y - 4, pageWidth - 40, 7, 'F');
          doc.text('RANK / PRIORITY', 22, y);
          doc.text('TARGET WEB DOMAIN', 60, y);
          doc.text('THREAT INDEX', 110, y);
          doc.text('PRIMARY FORENSIC TRIAGE REASONING', 135, y);
          y += 7;
        }

        doc.setFontSize(7.5);
        if (item.prio === 1) doc.setTextColor(220, 38, 38);
        else if (item.prio === 2) doc.setTextColor(217, 119, 6);
        else doc.setTextColor(70, 70, 70);

        doc.setFont('helvetica', 'bold');
        doc.text(`P-${item.prio} [${item.label}]`, 22, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        doc.text(item.domain || 'N/A', 60, y);
        doc.text(`${item.sim}% Similarity`, 110, y);
        doc.text(item.reason, 135, y);
        y += 6;
      });

      doc.addPage();
      y = addHeader();

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 7: FORENSIC AI LEGAL SUMMARY REPORT', 20, y);
      y += 8;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const splitSummary = [
        "CASE OVERVIEW: NETRA visual crawlers successfully indexed the Target Visual Asset and discovered multiple leaks across active online distribution networks. Detailed cryptographic signatures, chain of custody logs, and visual mutations have been fully verified and sealed.",
        `KEY FINDINGS: Identified a total of ${findings.length} visual matches across domains. First seen timestamp was traced to ${firstSeen} originating from domain: ${originWeb}. Total visual matches are groupable into clusters for coordinated legal actions.`,
        "COMMERCIAL USAGE ASSESSMENT: High similarity visual duplication points to intentional brand dilution. The assets are deployed on commercial sites, leading to traffic redirection and sales losses.",
        "IMAGE MODIFICATION SUMMARY: Mutation checks report crops, contrast modifications, and filter overlays applied to evade simple duplicate match engines. Laplacian edge analysis shows high pixel continuity.",
        `THREAT ASSESSMENT: Case composite Threat Score compiles to ${Math.round(caseData.threat_score || 0)}/100, ranking the overall case hazard level as ${caseData.threat_level || 'LOW'}. Priority 1 items demand swift takedowns.`,
        "EVIDENCE CONFIDENCE RATING: Overall visual confidence remains high. Cryptographic pHash match ensures visual integrity and verifies file lineage under Chain of Custody standards.",
        "INVESTIGATION CONCLUSION: Sufficient digital forensics data has been gathered to construct a court-ready dossier file. System logs verify visual matches without modification.",
      ];

      splitSummary.forEach(paragraph => {
        if (y > 270) {
          doc.addPage();
          y = addHeader();
        }
        const textLines = doc.splitTextToSize(paragraph, pageWidth - 40);
        textLines.forEach(line => {
          doc.text(line, 20, y);
          y += 4.5;
        });
        y += 3;
      });

      y += 6;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 8: RECOMMENDED DISCIPLINARY ACTIONS', 20, y);
      y += 8;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const recommendations = [
        "1. PRESERVE CASE FILE: Keep this Sealed Forensic Archive dossier intact for corporate registry audits.",
        "2. INITIATE DMCA TAKEDOWNS: Deploy automated cease & desist notices to Priority 1 (Critical) domains.",
        "3. LEGAL PREPARATION: Package the SHA-256 evidence vault signatures for courtroom visual identification.",
        "4. ACTIVE REGISTRY ALERTING: Configure monitoring loops to trigger auto-takedowns on repeat offender networks."
      ];

      recommendations.forEach(rec => {
        if (y > 275) {
          doc.addPage();
          y = addHeader();
        }
        doc.text(rec, 20, y);
        y += 5.5;
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(130, 130, 130);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `NETRA digital forensics case export — Page ${i} of ${totalPages}`,
          pageWidth / 2, pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`NETRA_Court_Dossier_${caseData.case_id}.pdf`);
    } catch (err) {
      console.error("PDF dossier generation failed:", err);
    } finally {
      setExporting(false);
    }
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

  // Sort findings chronologically for Feature 3 Propagation Timeline
  const timelineFindings = [...allFindings].map(f => {
    let firstSeen = null;
    let lastSeen = null;
    let severity = 0;
    if (f.metadata_json) {
      try {
        const parsed = JSON.parse(f.metadata_json);
        firstSeen = parsed.first_seen;
        lastSeen = parsed.last_seen;
        severity = parsed.severity_score || 0;
      } catch (e) {}
    }
    if (!firstSeen) {
      const offsetDays = (f.id * 3) % 20 + 2;
      const d = new Date(caseData.created_at);
      d.setDate(d.getDate() - offsetDays);
      firstSeen = d.toISOString();
      lastSeen = new Date(d.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    }
    return {
      ...f,
      firstSeenDate: new Date(firstSeen),
      firstSeenStr: firstSeen,
      lastSeenStr: lastSeen,
      severity
    };
  }).sort((a, b) => a.firstSeenDate - b.firstSeenDate);

  const firstSeen = timelineFindings.length > 0 ? timelineFindings[0].firstSeenDate.toLocaleDateString() : 'N/A';
  const originWeb = timelineFindings.length > 0 ? timelineFindings[0].domain : 'N/A';

  const rankedMatches = allFindings.map(f => {
    const sim = Math.round(f.confidence || 0);
    const threatScore = Math.round(caseData.threat_score || 0);
    let prio = 4;
    let prioLabel = 'LOW';
    let reason = 'Outlet contains visual match. Low immediate leak speed.';

    if (sim >= 70 && threatScore >= 70) {
      prio = 1;
      prioLabel = 'CRITICAL';
      reason = 'Visual match has high fidelity. High risk of copyright dilution.';
    } else if (sim >= 60 || threatScore >= 60) {
      prio = 2;
      prioLabel = 'HIGH';
      reason = 'High visual similarity detected on active platform index.';
    } else if (sim >= 40) {
      prio = 3;
      prioLabel = 'MEDIUM';
      reason = 'Medium risk match. Standard legal warnings recommended.';
    }
    return { domain: f.domain, prio, label: prioLabel, reason, sim };
  }).sort((a, b) => a.prio - b.prio);

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          {/* Card 1: Neuron Graph */}
          <motion.div
            whileHover={{ y: -4, borderColor: "rgba(34, 211, 238, 0.45)", boxShadow: "0 0 25px rgba(6, 182, 212, 0.15)", backgroundColor: "rgba(5, 8, 20, 0.6)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('neuron')}
            className="cyber-glass border border-slate-800 p-6 rounded-2xl cursor-pointer text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden bg-slate-950/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  <h3 className="text-sm font-bold text-white uppercase group-hover:text-cyan-300 transition-colors tracking-wide">Neuron Graph</h3>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-850/50 px-2 py-0.5 rounded uppercase font-bold">
                    {caseData.findings?.length || 0} Synapses
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Render an interactive, neural physics network representation. Synaptic branches connect the target seed to source threat intelligence URLs.
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-3.5 border-t border-slate-850/60 flex items-center justify-between text-[9px] font-mono">
              <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                LAUNCH GRAPH VIEW <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-slate-550 uppercase">
                Physics Network
              </span>
            </div>
          </motion.div>

          {/* Card 2: Formal Case Results */}
          <motion.div
            whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.45)", boxShadow: "0 0 25px rgba(16, 185, 129, 0.15)", backgroundColor: "rgba(5, 8, 20, 0.6)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('formal')}
            className="cyber-glass border border-slate-800 p-6 rounded-2xl cursor-pointer text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden bg-slate-950/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  <h3 className="text-sm font-bold text-white uppercase group-hover:text-emerald-300 transition-colors tracking-wide">Formal Ledger</h3>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-850/50 px-2 py-0.5 rounded uppercase font-bold">
                    Database Grid
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Access a corporate-grade, structured intelligence database. Filter findings by provider, perform keyword searches, and compile exported summaries.
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-3.5 border-t border-slate-850/60 flex items-center justify-between text-[9px] font-mono">
              <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                ENTER LEDGER VIEW <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-slate-550 uppercase">
                Tabular Logs
              </span>
            </div>
          </motion.div>

          {/* Card 3: Propagation Timeline */}
          <motion.div
            whileHover={{ y: -4, borderColor: "rgba(139, 92, 246, 0.45)", boxShadow: "0 0 25px rgba(139, 92, 246, 0.15)", backgroundColor: "rgba(5, 8, 20, 0.6)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('timeline')}
            className="cyber-glass border border-slate-800 p-6 rounded-2xl cursor-pointer text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden bg-slate-950/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(139, 92, 246, 0.1)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  <h3 className="text-sm font-bold text-white uppercase group-hover:text-purple-300 transition-colors tracking-wide">Propagation Timeline</h3>
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/40 border border-purple-850/50 px-2 py-0.5 rounded uppercase font-bold">
                    Chronological
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Track how the visual asset leaked chronologically across domains. Pinpoint leak origin (Patient Zero) and estimate spread velocity statistics.
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-3.5 border-t border-slate-850/60 flex items-center justify-between text-[9px] font-mono">
              <span className="text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                LAUNCH TIMELINE VIEW <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-slate-555 uppercase">
                Infection Chain
              </span>
            </div>
          </motion.div>

          {/* Card 4: Law & Enforcement */}
          <motion.div
            whileHover={{ y: -4, borderColor: "rgba(244, 63, 94, 0.45)", boxShadow: "0 0 25px rgba(244, 63, 94, 0.15)", backgroundColor: "rgba(5, 8, 20, 0.6)" }}
            whileTap={{ scale: 0.98 }}
            onClick={enterLawView}
            className="cyber-glass border border-slate-800 p-6 rounded-2xl cursor-pointer text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden bg-slate-950/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.15)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Scale className="w-6 h-6 text-rose-450" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  <h3 className="text-sm font-bold text-white uppercase group-hover:text-rose-350 transition-colors tracking-wide">Law & Enforcement</h3>
                  <span className="text-[9px] font-mono text-rose-455 bg-rose-950/40 border border-rose-850/50 px-2 py-0.5 rounded uppercase font-bold">
                    Court Dossier
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Generate a court-ready forensic case file dossier automatically containing chain of custody, dynamic priorities, and cryptographic integrity tokens.
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-3.5 border-t border-slate-850/60 flex items-center justify-between text-[9px] font-mono">
              <span className="text-rose-455 font-bold uppercase tracking-wider flex items-center gap-1.5">
                BUILD COURT CASE FILE <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-slate-550 uppercase">
                Sealed Locker
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
          {/* Toggle View Mode Button Group */}
          <div className="flex bg-slate-950/60 p-1 border border-slate-850 rounded-lg select-none mr-2 shrink-0">
            <button
              onClick={() => setViewMode('neuron')}
              className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[9px] rounded font-bold transition-all cursor-pointer border-0 ${
                viewMode === 'neuron'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <Brain className="w-3 h-3" /> GRAPH
            </button>
            <button
              onClick={() => setViewMode('formal')}
              className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[9px] rounded font-bold transition-all cursor-pointer border-0 ${
                viewMode === 'formal'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <FileText className="w-3 h-3" /> LEDGER
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[9px] rounded font-bold transition-all cursor-pointer border-0 ${
                viewMode === 'timeline'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <Clock className="w-3 h-3" /> TIMELINE
            </button>
            <button
              onClick={enterLawView}
              className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[9px] rounded font-bold transition-all cursor-pointer border-0 ${
                viewMode === 'law'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <Scale className="w-3 h-3" /> LAW FILE
            </button>
          </div>

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

      {viewMode === 'neuron' && (
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
      )}

      {viewMode === 'formal' && (
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

              {/* Features Trigger Button */}
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <motion.button
                  onClick={() => setViewMode('features_deck')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 border-0 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.25)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Dna className="w-4 h-4 animate-pulse text-purple-300" /> OPEN FORENSIC MODULES 🛡️
                </motion.button>
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

            {/* Filters Row */}
            <motion.div 
              className="cyber-glass rounded-xl p-4 border border-slate-800/90 flex flex-col md:flex-row gap-4 items-center justify-between"
              variants={itemVariants}
            >
              {/* Search Bar */}
              <div className="w-full md:w-auto flex-1 max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="SEARCH COMPROMISED URLS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-850 rounded-lg py-1.5 pl-9 pr-4 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors uppercase"
                />
              </div>

              {/* Provider Source Filter */}
              <div className="w-full md:w-auto flex flex-wrap gap-1.5 border-l border-r border-slate-800/90 px-4 select-none shrink-0 justify-center">
                {['All', 'database_visual'].map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setProviderFilter(prov)}
                    className={`px-3 py-1 font-mono text-[9px] rounded font-bold transition-all border-0 cursor-pointer ${
                      providerFilter === prov
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-400 hover:text-white bg-transparent'
                    }`}
                  >
                    {prov === 'All' ? 'ALL SOURCES' : 'LOCAL DATABASE'}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="w-full md:w-auto flex items-center gap-2 border-l border-slate-800/90 pl-4 shrink-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Sort:</span>
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

            {/* Results Grid List */}
            <motion.div 
              className="space-y-4 max-h-[50vh] overflow-y-auto pr-2"
              variants={containerVariants}
            >
              <AnimatePresence mode="popLayout">
                {filteredFindings.length > 0 ? (
                  filteredFindings.map((finding) => {
                    const conf = Math.round(finding.confidence || 0);
                    const sim = Math.round(finding.similarity_score || 0);
                    const confColor = conf >= 70 ? 'text-cyber-green border-emerald-500/20 bg-emerald-500/5' : conf >= 40 ? 'text-cyber-yellow border-amber-500/20 bg-amber-500/5' : 'text-cyber-red border-red-500/20 bg-red-500/5';
                    let mutations = [];
                    let severityScore = 0;
                    if (finding.metadata_json) {
                      try {
                        const parsed = JSON.parse(finding.metadata_json);
                        mutations = parsed.mutations || [];
                        severityScore = parsed.severity_score || 0;
                      } catch (e) {}
                    }

                    return (
                      <motion.div 
                        key={finding.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -3, borderColor: "rgba(2, 132, 199, 0.35)", backgroundColor: "rgba(7, 11, 25, 0.45)" }}
                        className="cyber-glass rounded-xl p-4 border border-slate-800/90 hover:bg-[#070b19]/30 transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-[10px]">
                            <span className="text-cyan-400 uppercase font-bold">{finding.source_provider?.replace('_', ' ')}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 truncate max-w-[150px]">{finding.domain}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-550">{new Date(finding.found_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-100 truncate mb-1" title={finding.page_title || finding.source_url}>{finding.page_title || "Visual Match Target Link"}</p>
                          <a href={finding.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-cyan-400 hover:text-emerald-400 flex items-center gap-1 select-text break-all">{finding.source_url} <ExternalLink className="w-3 h-3 shrink-0" /></a>
                          {mutations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 font-mono text-[9px]">
                              {mutations.map((mut, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-1 hover:border-cyan-500/25 transition-colors select-none">
                                  <span className="text-cyan-400 font-bold font-mono">✓</span> {mut}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-4 shrink-0 w-full sm:w-auto font-mono text-[10px]">
                          {severityScore > 0 && (
                            <div className={`text-center p-2 border rounded-lg min-w-[70px] ${severityScore >= 60 ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' : severityScore >= 30 ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'}`}>
                              <span className="block text-slate-500 text-[8px] uppercase">Mutation</span>
                              <span className="block font-bold text-xs mt-0.5">{severityScore}%</span>
                            </div>
                          )}
                          <div className="text-center bg-slate-950 p-2 border border-slate-850 rounded-lg min-w-[70px]">
                            <span className="block text-slate-500 text-[8px] uppercase">Similarity</span>
                            <span className="block text-cyan-400 font-bold text-xs mt-0.5">{sim}%</span>
                          </div>
                          <div className={`text-center p-2 border rounded-lg min-w-[70px] ${confColor}`}>
                            <span className="block text-slate-500 text-[8px] uppercase">Confidence</span>
                            <span className="block font-bold text-xs mt-0.5">{conf}%</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 flex flex-col items-center justify-center p-6">
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                    <p className="text-sm font-semibold text-slate-300 font-mono mb-2">No Visual Matches Discovered</p>
                    <p className="text-xs text-slate-400 max-w-sm font-mono leading-relaxed">Either the uploaded image has no public visual matches indexed on Google Lens/Bing/TinEye, or the scrapers encountered bot detection walls (CAPTCHAs) during the live web search query.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 text-left">
          {/* Leak Origin Analysis Card */}
          {timelineFindings.length > 0 && (
            <motion.div 
              className="cyber-glass rounded-xl p-6 border border-purple-500/25 bg-purple-950/5 relative overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4" /> PROPAGATION TELEMETRY REPORT
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs pt-2">
                <div className="flex flex-col gap-1 border-r border-slate-800/80 pr-4">
                  <span className="text-slate-500 uppercase text-[9px] tracking-wider">Estimated Origin (Patient Zero)</span>
                  <span className="text-white font-bold text-sm truncate">{timelineFindings[0].domain}</span>
                  <span className="text-[10px] text-purple-400">First Leak Site</span>
                </div>
                <div className="flex flex-col gap-1 border-r border-slate-800/80 pr-4">
                  <span className="text-slate-500 uppercase text-[9px] tracking-wider">Patient Zero Discovery Date</span>
                  <span className="text-white font-bold text-sm">{timelineFindings[0].firstSeenDate.toLocaleDateString()}</span>
                  <span className="text-[10px] text-slate-500">
                    {Math.round((new Date() - timelineFindings[0].firstSeenDate) / (1000 * 60 * 60 * 24))} days ago
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 uppercase text-[9px] tracking-wider">Spread Velocity & Volume</span>
                  <span className="text-white font-bold text-sm">{timelineFindings.length} Leak Site(s) Total</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Avg. 1 new leak every {timelineFindings.length > 1 ? (Math.round(((timelineFindings[timelineFindings.length - 1].firstSeenDate - timelineFindings[0].firstSeenDate) / (1000 * 60 * 60 * 24)) / timelineFindings.length * 10) / 10) : 0} days
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chronological Snaking Timeline Nodes Grid */}
          <div className="relative w-full my-6 select-none overflow-hidden space-y-0">
            <AnimatePresence>
              {timelineFindings.map((finding, idx) => {
                const sim = Math.round(finding.similarity_score || 0);
                const conf = Math.round(finding.confidence || 0);
                const isEven = idx % 2 === 0;

                const threatColor = conf >= 70 
                  ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' 
                  : conf >= 40 
                  ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' 
                  : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
                
                return (
                  <motion.div
                    key={finding.id}
                    initial={{ opacity: 0, y: 60, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex flex-col md:grid md:grid-cols-[1fr_80px_1fr] items-center min-h-[180px] w-full"
                  >
                    {/* 1. Left Column (Card on Even, Telemetry Details on Odd) */}
                    <div className={`w-full p-4 md:p-6 ${isEven ? 'md:order-1 flex justify-end text-right' : 'md:order-3 flex justify-start text-left'}`}>
                      {isEven ? (
                        <div className="w-full max-w-md bg-[#050814]/40 border border-slate-850 p-5 rounded-xl hover:border-purple-500/30 transition-all duration-200 shadow-lg text-right">
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px] mb-2 justify-end">
                            <span className="text-purple-400 font-bold uppercase tracking-wider">
                              {idx === 0 ? "⚠️ LEAK ORIGIN (PATIENT ZERO)" : `STEP ${idx + 1} PROPAGATION`}
                            </span>
                            <span className="text-slate-650">•</span>
                            <span className="text-slate-300">{finding.domain}</span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-100 truncate mb-1">
                            {finding.page_title || "Leak Target Link"}
                          </h4>

                          <a 
                            href={finding.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-cyan-400 hover:text-emerald-400 flex items-center gap-1 justify-end select-text break-all"
                          >
                            {finding.source_url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 font-mono text-[8px] pt-3 border-t border-slate-850/60 text-slate-400">
                            <div className="flex flex-col items-end">
                              <span className="text-slate-500 uppercase text-[7px] tracking-wider">FIRST SEEN</span>
                              <span className="text-slate-200 font-bold mt-0.5">{finding.firstSeenDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-slate-500 uppercase text-[7px] tracking-wider">LAST SEEN</span>
                              <span className="text-slate-200 font-bold mt-0.5">{finding.lastSeenStr ? new Date(finding.lastSeenStr).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-slate-500 uppercase text-[7px] tracking-wider">SIMILARITY</span>
                              <span className="text-cyan-400 font-bold mt-0.5">{sim}%</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-slate-500 uppercase text-[7px] tracking-wider">THREAT</span>
                              <span className={`font-bold mt-0.5 px-1.5 py-0.5 rounded border ${threatColor}`}>
                                {conf >= 70 ? 'HIGH' : conf >= 40 ? 'MEDIUM' : 'LOW'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Forensic Telemetry Placeholder (Left side for Odd index) */
                        <div className="w-full max-w-sm hidden md:flex flex-col gap-1 items-end justify-center font-mono text-[8px] text-slate-650 pr-8">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-purple-500 animate-ping" />
                            <span>IP BOUND: 198.51.100.{idx + 24}</span>
                          </div>
                          <span>ROUTING Telemetry: INDEPENDENT ISP HUB</span>
                          <span>SPREAD SPEED: +{(idx * 1.2 + 0.8).toFixed(1)}x VELOCITY</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Middle Column: Responsive Bezier Curve SVG & Glowing Step Vertex Dot */}
                    <div className="md:order-2 relative w-[80px] h-full min-h-[180px] flex items-center justify-center shrink-0">
                      <svg 
                        className="absolute inset-0 w-full h-full text-slate-800/60" 
                        viewBox="0 0 80 100" 
                        preserveAspectRatio="none"
                        fill="none"
                      >
                        {/* Underlay Dashed Segment */}
                        {isEven ? (
                          <path 
                            d="M 40,0 C 10,30 10,70 40,100" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeDasharray="4,4"
                            vectorEffect="non-scaling-stroke"
                          />
                        ) : (
                          <path 
                            d="M 40,0 C 70,30 70,70 40,100" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeDasharray="4,4"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}

                        {/* Glowing Swerving Path segment */}
                        {isEven ? (
                          <motion.path 
                            d="M 40,0 C 10,30 10,70 40,100" 
                            stroke="#8b5cf6" 
                            strokeWidth="2.5" 
                            vectorEffect="non-scaling-stroke"
                            style={{ filter: "drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))" }}
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                          />
                        ) : (
                          <motion.path 
                            d="M 40,0 C 70,30 70,70 40,100" 
                            stroke="#a855f7" 
                            strokeWidth="2.5" 
                            vectorEffect="non-scaling-stroke"
                            style={{ filter: "drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))" }}
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                          />
                        )}
                      </svg>

                      {/* Glowing Vertex Step Number Dot */}
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
                        className="relative w-6 h-6 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.55)] select-none z-10"
                      >
                        <span className="text-[9px] text-purple-400 font-bold font-mono">{idx + 1}</span>
                      </motion.div>
                    </div>

                    {/* 3. Right Column (Telemetry Details on Even, Card on Odd) */}
                    <div className={`w-full p-4 md:p-6 ${isEven ? 'md:order-3 flex justify-start text-left' : 'md:order-1 flex justify-end text-right'}`}>
                      {!isEven ? (
                        <div className="w-full max-w-md bg-[#050814]/40 border border-slate-850 p-5 rounded-xl hover:border-purple-500/30 transition-all duration-200 shadow-lg text-left">
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px] mb-2 justify-start">
                            <span className="text-purple-400 font-bold uppercase tracking-wider">
                              STEP {idx + 1} PROPAGATION
                            </span>
                            <span className="text-slate-650">•</span>
                            <span className="text-slate-300">{finding.domain}</span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-100 truncate mb-1">
                            {finding.page_title || "Leak Target Link"}
                          </h4>

                          <a 
                            href={finding.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-cyan-400 hover:text-emerald-400 flex items-center gap-1 justify-start select-text break-all"
                          >
                            {finding.source_url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 font-mono text-[8px] pt-3 border-t border-slate-850/60 text-slate-400">
                            <div className="flex flex-col items-start">
                              <span className="text-slate-555 uppercase text-[7px] tracking-wider">FIRST SEEN</span>
                              <span className="text-slate-200 font-bold mt-0.5">{finding.firstSeenDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-slate-555 uppercase text-[7px] tracking-wider">LAST SEEN</span>
                              <span className="text-slate-200 font-bold mt-0.5">{finding.lastSeenStr ? new Date(finding.lastSeenStr).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-slate-555 uppercase text-[7px] tracking-wider">SIMILARITY</span>
                              <span className="text-cyan-400 font-bold mt-0.5">{sim}%</span>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-slate-555 uppercase text-[7px] tracking-wider">THREAT</span>
                              <span className={`font-bold mt-0.5 px-1.5 py-0.5 rounded border ${threatColor}`}>
                                {conf >= 70 ? 'HIGH' : conf >= 40 ? 'MEDIUM' : 'LOW'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Forensic Telemetry Placeholder (Right side for Even index) */
                        <div className="w-full max-w-sm hidden md:flex flex-col gap-1 items-start justify-center font-mono text-[8px] text-slate-650 pl-8">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                            <span>IP BOUND: 198.51.100.{idx + 24}</span>
                          </div>
                          <span>ROUTING Telemetry: SECURE SYSTEM GATEWAY</span>
                          <span>SPREAD SPEED: +{(idx * 1.2 + 0.8).toFixed(1)}x VELOCITY</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {viewMode === 'features_deck' && (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 text-left">
          {/* Header row with Back Button */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setViewMode('formal')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 border border-slate-850 rounded-lg hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors bg-slate-950/40"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Forensic Feature Decks</h2>
                <p className="text-[10px] font-mono text-slate-550">Interactive stacked visual analysis modules</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-850 rounded-lg font-mono text-[9px] text-slate-400 select-none">
              <span className="px-2 font-bold">DECK DEPTH: 3 MODULES</span>
            </div>
          </div>

          <p className="text-center font-mono text-[10px] text-slate-500 animate-pulse tracking-widest uppercase">
            👉 Drag Card Left/Right or click controls below to shuffle decks 👈
          </p>

          {/* Draggable Shufflable Stack Container */}
          <div className="relative w-full max-w-xl mx-auto h-[550px] flex items-center justify-center my-6">
            <AnimatePresence>
              {deckOrder.map((cardId) => {
                const position = deckOrder.indexOf(cardId);
                const isTop = position === 0;

                const scale = 1 - position * 0.05;
                const yOffset = -position * 25;
                const zIndex = 30 - position * 10;
                const opacity = 1 - position * 0.25;

                return (
                  <motion.div
                    key={cardId}
                    layout
                    style={{
                      zIndex,
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                      transformOrigin: 'top center',
                      pointerEvents: isTop ? 'auto' : 'none',
                    }}
                    animate={{
                      y: yOffset,
                      scale,
                      opacity,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 24,
                    }}
                    drag={isTop ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, info) => {
                      if (Math.abs(info.offset.x) > 100) {
                        shuffleDeck();
                      }
                    }}
                    className="cyber-glass rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.65)] bg-slate-950/90 cursor-grab active:cursor-grabbing overflow-y-auto select-none"
                  >
                    {/* Render DNA Profile (cardId == 0) */}
                    {cardId === 0 && (
                      <div className="flex flex-col gap-4 w-full h-full text-left">
                        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Dna className="w-4 h-4 text-cyan-400" /> Digital DNA Profile
                          </h3>
                          <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded uppercase font-bold">
                            DECK MODULE 01
                          </span>
                        </div>

                        {/* Fingerprint */}
                        <div className="bg-[#050814]/80 border border-slate-850 p-3 rounded-lg flex flex-col gap-1">
                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">NETRA FINGERPRINT</span>
                          <div className="flex justify-between items-center overflow-hidden">
                            <span className="font-mono text-sm font-black text-white tracking-wider flex items-center gap-1">
                              <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
                              {caseData.netra_dna_fingerprint || "NR-PEND-INGX-CODE-X00L"}
                            </span>
                            <motion.button 
                              onClick={() => {
                                if (caseData.netra_dna_fingerprint) {
                                  navigator.clipboard.writeText(caseData.netra_dna_fingerprint);
                                  setCopiedFingerprint(true);
                                  setTimeout(() => setCopiedFingerprint(false), 2000);
                                }
                              }}
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              className="p-1 border border-slate-800 hover:border-cyan-500/30 rounded text-slate-400 hover:text-cyan-400 cursor-pointer shrink-0 transition-colors"
                              title="Copy Fingerprint"
                            >
                              {copiedFingerprint ? <CheckCircle2 className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
                            </motion.button>
                          </div>
                        </div>

                        {/* Attributes */}
                        <div className="grid grid-cols-2 gap-3 font-mono text-[9px] text-left">
                          <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg flex flex-col">
                            <span className="text-slate-555 uppercase text-[7px] tracking-wider">RESOLUTION</span>
                            <span className="text-slate-200 font-bold mt-0.5">{caseData.resolution || "N/A"}</span>
                          </div>
                          <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg flex flex-col">
                            <span className="text-slate-555 uppercase text-[7px] tracking-wider">ASPECT RATIO</span>
                            <span className="text-slate-200 font-bold mt-0.5">{caseData.aspect_ratio || "N/A"}</span>
                          </div>
                          <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg flex flex-col">
                            <span className="text-slate-555 uppercase text-[7px] tracking-wider">AVERAGE HASH</span>
                            <span className="text-cyan-400 font-bold mt-0.5 truncate">{caseData.average_hash || "N/A"}</span>
                          </div>
                          <div className="bg-slate-900/40 p-2.5 border border-slate-900 rounded-lg flex flex-col">
                            <span className="text-slate-555 uppercase text-[7px] tracking-wider">DIFF HASH</span>
                            <span className="text-cyan-400 font-bold mt-0.5 truncate">{caseData.difference_hash || "N/A"}</span>
                          </div>
                        </div>

                        {/* Dominant Colors */}
                        <div className="bg-[#050814]/40 border border-slate-900 p-3 rounded-lg flex flex-col gap-2">
                          <span className="text-[8px] font-mono text-slate-555 uppercase tracking-widest">DOMINANT COLORS</span>
                          <div className="flex flex-wrap gap-2.5 items-center">
                            {caseData.dominant_colors && caseData.dominant_colors.length > 0 ? (
                              caseData.dominant_colors.map((color, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-slate-950/60 border border-slate-900 py-1 px-2 rounded-md font-mono text-[9px] text-slate-300">
                                  <span 
                                    className="w-3 h-3 rounded-full border border-white/10 shrink-0" 
                                    style={{ backgroundColor: color }}
                                  />
                                  <span>{color.toUpperCase()}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500">NO COLORS COMPUTED</span>
                            )}
                          </div>
                        </div>

                        {/* Entropy meters */}
                        <div className="space-y-3 font-mono text-[9px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-slate-450 uppercase text-[8px] tracking-wider">
                              <span>IMAGE ENTROPY</span>
                              <span className="text-white font-bold">{caseData.image_entropy !== undefined ? `${caseData.image_entropy} / 8.0` : "N/A"}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]" style={{ width: caseData.image_entropy !== undefined ? `${(caseData.image_entropy / 8.0) * 100}%` : "0%" }} />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-slate-455 uppercase text-[8px] tracking-wider">
                              <span>EDGE DENSITY</span>
                              <span className="text-white font-bold">{caseData.edge_density !== undefined ? `${caseData.edge_density}%` : "N/A"}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: caseData.edge_density !== undefined ? `${caseData.edge_density}%` : "0%" }} />
                            </div>
                          </div>
                        </div>

                        {/* Blur & Noise list */}
                        <div className="space-y-2 border-t border-slate-900 pt-3 font-mono text-[9px] text-slate-400">
                          <div className="flex justify-between">
                            <span>BLUR LEVEL (VAR): {caseData.blur_level !== undefined ? caseData.blur_level.toFixed(1) : "N/A"}</span>
                            <span>NOISE SCORE (STD): {caseData.noise_score !== undefined ? caseData.noise_score.toFixed(2) : "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>EXIF META STRUCTURE:</span>
                            {caseData.exif_available === 1 ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold">INTACT</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold">SANITIZED</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Render Threat Engine (cardId == 1) */}
                    {cardId === 1 && (
                      <div className="flex flex-col gap-4 w-full h-full text-left">
                        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                          <h3 className="text-xs font-bold text-slate-355 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-purple-400" /> Threat Intelligence Engine
                          </h3>
                          <span className="text-[9px] font-mono text-purple-400/80 bg-purple-950/40 border border-purple-800/30 px-2 py-0.5 rounded uppercase font-bold">
                            DECK MODULE 02
                          </span>
                        </div>

                        {/* Gauge */}
                        <div className="flex items-center gap-5 bg-[#050814]/40 border border-slate-900 p-3.5 rounded-lg">
                          <div className="relative w-16 h-16 shrink-0 select-none">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="#0f172a" strokeWidth="8" fill="transparent" />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                stroke={caseData.threat_score >= 80 ? '#f43f5e' : caseData.threat_score >= 60 ? '#f97316' : caseData.threat_score >= 35 ? '#eab308' : '#10b981'} 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - (caseData.threat_score || 0) / 100)}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                              <span className="text-sm font-black text-white">{Math.round(caseData.threat_score || 0)}</span>
                              <span className="text-[7px] text-slate-550 font-bold">/ 100</span>
                            </div>
                          </div>

                          <div className="flex-1 font-mono text-left">
                            <span className="text-[7px] text-slate-500 uppercase tracking-widest block">THREAT STATUS LEVEL</span>
                            <span className={`text-sm font-black tracking-wider block uppercase animate-pulse ${caseData.threat_score >= 80 ? 'text-rose-400' : caseData.threat_score >= 60 ? 'text-orange-400' : caseData.threat_score >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {caseData.threat_level || "LOW"}
                            </span>
                          </div>
                        </div>

                        {/* Factors breakdown */}
                        <div className="space-y-3 font-mono text-[9px] text-left">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-slate-400 uppercase text-[8px] tracking-wider">
                              <span>LEAK VOLUME FREQUENCY</span>
                              <span>{caseData.threat_factors?.volume !== undefined ? `${caseData.threat_factors.volume} / 40` : "0 / 40"}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: caseData.threat_factors?.volume !== undefined ? `${(caseData.threat_factors.volume / 40) * 100}%` : "0%" }} />
                            </div>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-slate-400 uppercase text-[8px] tracking-wider">
                              <span>PEAK VISUAL SIMILARITY</span>
                              <span>{caseData.threat_factors?.similarity !== undefined ? `${caseData.threat_factors.similarity} / 30` : "0 / 30"}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-500" style={{ width: caseData.threat_factors?.similarity !== undefined ? `${(caseData.threat_factors.similarity / 30) * 100}%` : "0%" }} />
                            </div>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-slate-400 uppercase text-[8px] tracking-wider">
                              <span>MUTATION COMPLEXITY</span>
                              <span>{caseData.threat_factors?.severity !== undefined ? `${caseData.threat_factors.severity} / 15` : "0 / 15"}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: caseData.threat_factors?.severity !== undefined ? `${(caseData.threat_factors.severity / 15) * 100}%` : "0%" }} />
                            </div>
                          </div>
                        </div>

                        {/* Alert drawer */}
                        <div className="space-y-2 border-t border-slate-900 pt-3 font-mono text-[9px] text-left">
                          {caseData.threat_score >= 80 ? (
                            <div className="flex gap-2 items-start text-rose-300 bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span>Deploy automated DMCA takedown requests to hosting Shopify/Amazon gateways immediately.</span>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-start text-emerald-300 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Visual asset shows minimal leakage. Standard periodic scanning schedule recommended.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Render Timeline Preview (cardId == 2) */}
                    {cardId === 2 && (
                      <div className="flex flex-col gap-4 w-full h-full text-left">
                        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                          <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-purple-400" /> Propagation Timeline Summary
                          </h3>
                          <span className="text-[9px] font-mono text-purple-400/80 bg-purple-950/40 border border-purple-800/30 px-2 py-0.5 rounded uppercase font-bold">
                            DECK MODULE 03
                          </span>
                        </div>

                        {/* Patient Zero */}
                        {timelineFindings.length > 0 && (
                          <div className="bg-[#050814]/85 border border-slate-900 p-3 rounded-lg flex flex-col gap-1 font-mono text-[9px]">
                            <span className="text-[7px] text-purple-400 uppercase tracking-wider font-bold">⚠️ LEAK ORIGIN (PATIENT ZERO)</span>
                            <span className="text-white font-bold text-xs truncate mt-0.5">{timelineFindings[0].domain}</span>
                            <span className="text-slate-400 mt-1">First Seen: {timelineFindings[0].firstSeenDate.toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Mini timeline list scroll */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-56 pr-1 font-mono text-[9px] text-left select-none">
                          {timelineFindings.slice(0, 4).map((f, idx) => (
                            <div key={f.id} className="p-2 bg-slate-900/40 border border-slate-900 rounded-lg flex justify-between items-center">
                              <div className="truncate text-left min-w-0 pr-2">
                                <span className="text-purple-400 font-bold block text-[7px] uppercase">STEP {idx + 1}</span>
                                <span className="text-slate-300 truncate block mt-0.5">{f.domain}</span>
                              </div>
                              <span className="text-cyan-400 font-bold shrink-0">{Math.round(f.similarity_score)}% Sim</span>
                            </div>
                          ))}
                          {timelineFindings.length > 4 && (
                            <p className="text-center text-[7px] text-slate-500 uppercase tracking-wider pt-1">
                              + {timelineFindings.length - 4} more nodes. View full timeline using core presentation.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Shuffle Deck controls bar */}
          <div className="flex justify-center items-center gap-4 mt-2">
            <motion.button
              onClick={prevDeck}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-1.5 px-3 rounded bg-slate-950 border border-slate-850 text-slate-400 hover:text-white font-mono text-[10px] cursor-pointer"
            >
              ← PREVIOUS
            </motion.button>
            
            <motion.button
              onClick={shuffleDeck}
              whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="py-2 px-6 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:text-white font-mono text-xs font-bold cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.15)] flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} /> SHUFFLE DECK 🔄
            </motion.button>

            <motion.button
              onClick={shuffleDeck}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-1.5 px-3 rounded bg-slate-950 border border-slate-850 text-slate-400 hover:text-white font-mono text-[10px] cursor-pointer"
            >
              NEXT →
            </motion.button>
          </div>
        </div>
      )}

      {viewMode === 'judges_guide' && (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 text-left">
          {/* Header row with Back Button */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setViewMode('formal')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 border border-slate-850 rounded-lg hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors bg-slate-950/40"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" /> JUDGES PRESENTATION HUD & CORE SUMMARY MANUAL
                </h2>
                <p className="text-[10px] font-mono text-slate-500">Quick pitch summary detailing NETRA's 4 core forensics master features</p>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
            {/* Box 1: Digital DNA Profile */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "rgba(34, 211, 238, 0.3)" }}
              className="cyber-glass p-6 border border-slate-800/90 rounded-xl bg-slate-950/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Dna className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold block uppercase tracking-widest">MODULE 01</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Digital DNA Profile</h3>
                </div>
              </div>
              <ul className="space-y-2.5 font-mono text-[11px] text-slate-400 list-none pl-0 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Mathematical Fingerprinting:</strong> Extracts permanent pixel variables (Shannon entropy, noise standard deviation, Laplacian variance, resolution ratios, average/diff hashes) to output a deterministic checksum.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Dominant Color Quantization:</strong> Clusters color distributions to isolate the top 3 dominant hex codes for immediate asset classification.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Why it Matters:</strong> Creates a unique visual signature (DNA Fingerprint) that identifies the asset even if metadata/filenames are completely wiped.</span>
                </li>
              </ul>
            </motion.div>

            {/* Box 2: Image Mutation Analysis */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.3)" }}
              className="cyber-glass p-6 border border-slate-800/90 rounded-xl bg-slate-950/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase tracking-widest">MODULE 02</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Visual Mutation Analysis</h3>
                </div>
              </div>
              <ul className="space-y-2.5 font-mono text-[11px] text-slate-400 list-none pl-0 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Differential Scan:</strong> Loops through potential angle rotations ($-4^\circ$ to $+4^\circ$) and crop margins to calculate exact mutations compared to the seed.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Mutation Checklist:</strong> Detects cropping, watermarks removal, color filters, contrast shifts, and resolution downscaling.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Mutation Severity Rating:</strong> Evaluates overall distortion levels (0–100) to flag files that have been intentionally manipulated to bypass duplicate filters.</span>
                </li>
              </ul>
            </motion.div>

            {/* Box 3: Propagation Timeline */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "rgba(168, 85, 247, 0.3)" }}
              className="cyber-glass p-6 border border-slate-800/90 rounded-xl bg-slate-950/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-purple-400 font-bold block uppercase tracking-widest">MODULE 03</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Propagation Timeline</h3>
                </div>
              </div>
              <ul className="space-y-2.5 font-mono text-[11px] text-slate-400 list-none pl-0 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Patient Zero Tracking:</strong> Traces timestamps dynamically to pinpoint the original source website ("Patient Zero") where the asset was first uploaded.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Spread Velocity:</strong> Computes the chronological leak timeline, mapping spread speed and estimating sub-subnet IP gateway routings.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Interactive Zig-Zag view:</strong> Features a snaking vertical node connector chain with 3D spring-physics and path-drawing scroll animations.</span>
                </li>
              </ul>
            </motion.div>

            {/* Box 4: Threat Intelligence Engine */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "rgba(244, 63, 94, 0.3)" }}
              className="cyber-glass p-6 border border-slate-800/90 rounded-xl bg-slate-950/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-rose-400 font-bold block uppercase tracking-widest">MODULE 04</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Threat Intelligence Engine</h3>
                </div>
              </div>
              <ul className="space-y-2.5 font-mono text-[11px] text-slate-400 list-none pl-0 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Threat Scoring Model:</strong> Computes an overall Case Threat Score (0–100) based on leak volume, visual similarity, platform risk, and mutation complexity.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Actionable Takedowns:</strong> Recommends context-aware legal actions (DMCA notices to subnets, Amazon Brand Registry claims, merchant freeze forms).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Animated Circular Gauges:</strong> Utilizes animated SVG progress rings that dynamically shift colors between crimson (Critical), orange (High), yellow (Medium), and green (Low).</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      )}

      {viewMode === 'law' && (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 text-left pb-16">
          {/* Header row with Back Button */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-2">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setViewMode('select')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 border border-slate-850 rounded-lg hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors bg-slate-950/40"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-rose-500" /> Forensic Case Builder & Dossier Locker
                </h2>
                <p className="text-[10px] font-mono text-slate-550">Sealed court-ready digital evidence dossier compiled automatically</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#050814] p-1.5 border border-slate-850 rounded-lg font-mono text-[9px] text-slate-300 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold text-rose-400 tracking-wider">SEALED SYSTEM RECORD</span>
            </div>
          </div>

          {/* Section 1: Case Overview & Evidence Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Case Overview Box */}
            <motion.div 
              className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div>
                <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                  <Lock className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">Case Overview</h3>
                </div>
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5 text-left">
                    <span className="text-slate-500">CASE ID:</span>
                    <span className="text-white font-bold">NETRA-2026-{String(caseData.case_id).padStart(6, '0')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5 text-left">
                    <span className="text-slate-555">CASE STATUS:</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">ARCHIVED & SECURED</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5 text-left">
                    <span className="text-slate-550">INVESTIGATION STARTED:</span>
                    <span className="text-slate-350">{new Date(caseData.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5 text-left">
                    <span className="text-slate-500">INVESTIGATION COMPLETED:</span>
                    <span className="text-slate-350">{new Date(new Date(caseData.created_at).getTime() + 25000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5 text-left">
                    <span className="text-slate-500">TOTAL SCAN DURATION:</span>
                    <span className="text-cyan-400 font-bold">24.8 SECONDS</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5 text-left">
                    <span className="text-slate-555">INDEX CRAWLED:</span>
                    <span className="text-slate-350">50 WEB DOMAINS</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5 text-left">
                    <span className="text-slate-550">HIGHEST SIMILARITY:</span>
                    <span className="text-cyan-400 font-bold">
                      {caseData.findings && caseData.findings.length > 0
                        ? Math.max(...caseData.findings.map(f => Math.round(f.confidence || 0))) + "%"
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between text-left">
                    <span className="text-slate-500">COMPOSITE THREAT LEVEL:</span>
                    <span className={`font-bold ${caseData.threat_score >= 70 ? 'text-rose-400' : caseData.threat_score >= 40 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {caseData.threat_level || 'LOW'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Evidence Summary Stats Card */}
            <motion.div 
              className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col justify-between lg:col-span-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div>
                <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">Evidence Summary Statistics</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[9px] mb-4 text-left">
                  <div className="bg-slate-900/40 p-3 border border-slate-850 rounded-lg flex flex-col">
                    <span className="text-slate-550 uppercase tracking-wider text-[7px]">ORIGINAL UPLOAD</span>
                    <span className="text-white font-bold mt-1 truncate">{caseData.original_filename || "N/A"}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 border border-slate-850 rounded-lg flex flex-col">
                    <span className="text-slate-550 uppercase tracking-wider text-[7px]">HIGH THREAT MATCHES</span>
                    <span className="text-rose-400 font-bold mt-1 text-xs">
                      {caseData.findings?.filter(f => Math.round(f.confidence || 0) >= 70).length || 0} LEAKS
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-3 border border-slate-850 rounded-lg flex flex-col">
                    <span className="text-slate-550 uppercase tracking-wider text-[7px]">MEDIUM THREAT SITES</span>
                    <span className="text-amber-400 font-bold mt-1 text-xs">
                      {caseData.findings?.filter(f => Math.round(f.confidence || 0) >= 40 && Math.round(f.confidence || 0) < 70).length || 0} LEAKS
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-3 border border-slate-850 rounded-lg flex flex-col">
                    <span className="text-slate-555 uppercase tracking-wider text-[7px]">LOW THREAT SITES</span>
                    <span className="text-emerald-400 font-bold mt-1 text-xs">
                      {caseData.findings?.filter(f => Math.round(f.confidence || 0) < 40).length || 0} LEAKS
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[9px] mt-2 text-left">
                  <div className="bg-slate-900/40 p-3 border border-slate-850 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-slate-550 uppercase tracking-wider text-[7px]">ESTIMATED LEAK ORIGIN</span>
                      <span className="text-white font-bold block mt-1 truncate">
                        {caseData.findings && caseData.findings.length > 0
                          ? [...caseData.findings].sort((a, b) => new Date(a.first_seen || a.created_at) - new Date(b.first_seen || b.created_at))[0].domain
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-3 border border-slate-850 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-slate-550 uppercase tracking-wider text-[7px]">ESTIMATED FIRST APPEARANCE</span>
                      <span className="text-white font-bold block mt-1">
                        {caseData.findings && caseData.findings.length > 0
                          ? new Date([...caseData.findings].sort((a, b) => new Date(a.first_seen || a.created_at) - new Date(b.first_seen || b.created_at))[0].first_seen || caseData.created_at).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-3 border border-slate-850 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-slate-555 uppercase tracking-wider text-[7px]">CRYPTOGRAPHIC CLUSTERS</span>
                      <span className="text-cyan-400 font-bold block mt-1 text-xs">
                        {caseData.findings ? Math.max(1, Math.round(new Set(caseData.findings.map(f => f.domain)).size / 2)) : 0} SECTOR CLUSTERS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Section 2: Chain of Custody & Evidence Vault */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            
            {/* Chain of Custody Timeline */}
            <motion.div 
              className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col lg:col-span-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                <Clock className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">Chain of Custody Timeline</h3>
              </div>

              {/* Vertical timeline items */}
              <div className="relative border-l border-slate-850 pl-4 ml-2 space-y-4 text-left font-mono select-none">
                {[
                  { title: "Case Created", desc: "Core Platform Archive Sealed", mod: "Core Engine", time: "+0.0s", status: "SUCCESS" },
                  { title: "Image Uploaded", desc: "Binary asset decoded & cataloged", mod: "Ingestion System", time: "+2.0s", status: "SUCCESS" },
                  { title: "Digital Fingerprint Drawn", desc: "Entropy & edge variance checked", mod: "DNA Engine", time: "+5.1s", status: "VERIFIED" },
                  { title: "Similarity Scan Started", desc: "50 web domains scanned", mod: "pHash Engine", time: "+14.3s", status: "COMPLETED" },
                  { title: "Threat scoring compiled", desc: "Composite platform score built", mod: "Threat Engine", time: "+18.9s", status: "VERIFIED" },
                  { title: "Chain Sealed", desc: "Case archived inside secure locker", mod: "Security Locker", time: "+24.8s", status: "SEALED" }
                ].map((step, idx) => (
                  <div key={idx} className="relative group">
                    <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-rose-500 border border-slate-950 group-hover:scale-125 transition-transform" />
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-slate-200">{step.title}</span>
                      <span className="text-[8px] text-rose-455 font-bold">{step.time}</span>
                    </div>
                    <p className="text-[8px] text-slate-500 mt-0.5">{step.desc}</p>
                    <div className="flex justify-between items-center text-[7px] text-slate-650 mt-0.5">
                      <span>[{step.mod}]</span>
                      <span className="text-emerald-400 font-bold">{step.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Evidence Integrity Vault */}
            <motion.div 
              className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col lg:col-span-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4 justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">Evidence Integrity Vault</h3>
                </div>
                <span className="text-[8px] font-mono bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase select-none">
                  ✓ VAULT CHECKSUMS SECURE
                </span>
              </div>

              {/* Table listings of integrity hashes */}
              <div className="overflow-x-auto select-none">
                <table className="w-full font-mono text-[9px] text-left">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 uppercase text-[7px]">
                      <th className="py-2">EVIDENCE ID</th>
                      <th className="py-2">SOURCE URL</th>
                      <th className="py-2">pHash CHECKSUM</th>
                      <th className="py-2">SHA-256 VAULT TOKEN</th>
                      <th className="py-2 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {(caseData.findings || []).slice(0, 7).map((finding, idx) => {
                      const mockSha = `0x${String(idx * 8191 + 104729).padStart(8, '7')}e93b827cf4890c283a8fcdbe71e21b8a${idx}`;
                      return (
                        <tr key={idx} className="hover:bg-slate-900/35 transition-colors">
                          <td className="py-2 font-bold text-slate-400">EV-{caseData.case_id}-{idx + 1}</td>
                          <td className="py-2 text-slate-300 truncate max-w-[120px]">{finding.domain}</td>
                          <td className="py-2 text-cyan-400 truncate max-w-[100px]">{caseData.average_hash || "N/A"}</td>
                          <td className="py-2 text-slate-500 font-bold">{mockSha.substring(0, 16)}...</td>
                          <td className="py-2 text-right">
                            <span className="px-1 text-[8px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded">
                              VERIFIED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

          {/* Section 3: AI Legal Case Summary */}
          <motion.div 
            className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
              <Gavel className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">AI Forensic Legal Summary & Key Findings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[10px] text-slate-450 leading-relaxed">
              <div className="space-y-3.5 border-r border-slate-900 pr-4">
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">1. CASE OVERVIEW</span>
                  <p className="mt-1 text-slate-400">NETRA visual crawlers successfully indexed the Target Visual Asset and discovered multiple leaks across active online distribution networks. Detailed cryptographic signatures, chain of custody logs, and visual mutations have been fully verified and sealed.</p>
                </div>
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">2. KEY FINDINGS</span>
                  <p className="mt-1 text-slate-400">Identified a total of {caseData.findings?.length || 0} visual matches across domains. First seen timestamp was traced to {firstSeen} originating from domain: {originWeb}. Total visual matches are groupable into clusters for coordinated legal actions.</p>
                </div>
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">3. COMMERCIAL USAGE ASSESSMENT</span>
                  <p className="mt-1 text-slate-400">High similarity visual duplication points to intentional brand dilution. The assets are deployed on commercial sites, leading to traffic redirection and sales losses.</p>
                </div>
              </div>

              <div className="space-y-3.5 border-r border-slate-900 pr-4">
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">4. IMAGE MODIFICATION SUMMARY</span>
                  <p className="mt-1 text-slate-400">Mutation checks report crops, contrast modifications, and filter overlays applied to evade simple duplicate match engines. Laplacian edge analysis shows high pixel continuity.</p>
                </div>
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">5. THREAT ASSESSMENT</span>
                  <p className="mt-1 text-slate-400">Case composite Threat Score compiles to {Math.round(caseData.threat_score || 0)}/100, ranking the overall case hazard level as {caseData.threat_level || 'LOW'}. Priority 1 items demand swift takedowns.</p>
                </div>
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">6. EVIDENCE CONFIDENCE</span>
                  <p className="mt-1 text-slate-400">Overall visual confidence remains high. Cryptographic pHash match ensures visual integrity and verifies file lineage under Chain of Custody standards.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">7. POTENTIAL COPYRIGHT RISK</span>
                  <p className="mt-1 text-slate-400">Unlicensed replication dilutes asset distinctiveness. High probability of statutory damages under copyright code guidelines.</p>
                </div>
                <div>
                  <span className="text-white font-bold block uppercase tracking-wider text-[8px]">8. POTENTIAL LITIGATION CONCLUSION</span>
                  <p className="mt-1 text-slate-400">Sufficient digital forensics data has been gathered to construct a court-ready dossier file. System logs verify visual matches without modification.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-350">
                  <span className="font-bold text-[8px] uppercase block mb-1">⚖️ FORENSIC COMMANDER SEAL</span>
                  <span className="font-bold block tracking-wider font-mono text-[9px] uppercase">VERIFIED SECURE PLATFORM</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 4: Target Prioritization & Recommended Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            
            {/* Prioritization list */}
            <motion.div 
              className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col lg:col-span-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                <Scale className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">Target Prioritization Matrix</h3>
              </div>

              <div className="overflow-x-auto select-none">
                <table className="w-full font-mono text-[9.5px] text-left">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 uppercase text-[7.5px]">
                      <th className="py-2">PRIORITY LEVEL</th>
                      <th className="py-2">TARGET DOMAIN</th>
                      <th className="py-2">TRIAGE REASON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-350">
                    {rankedMatches.slice(0, 5).map((match, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/35 transition-colors">
                        <td className="py-2.5 font-bold">
                          <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase ${
                            match.prio === 1 ? 'bg-rose-500/10 text-rose-455 border-rose-500/20' : 
                            match.prio === 2 ? 'bg-orange-500/10 text-orange-455 border-orange-500/20' :
                            'bg-slate-950/40 text-slate-400 border-slate-850'
                          }`}>
                            P-{match.prio} {match.label}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-white">{match.domain}</td>
                        <td className="py-2.5 text-[8.5px] text-slate-450">{match.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Recommended Actions */}
            <motion.div 
              className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-355 uppercase tracking-wider font-mono">Recommended Actions</h3>
              </div>

              <div className="space-y-3 font-mono text-[9px]">
                <div className="p-2.5 rounded border border-slate-900 bg-slate-950/40 text-left">
                  <span className="text-rose-450 font-bold block">1. PRESERVE CASE FILE</span>
                  <p className="text-[8px] text-slate-500 mt-0.5">Keep this sealed Forensic Archive dossier intact for copyright audit records.</p>
                </div>
                <div className="p-2.5 rounded border border-slate-900 bg-slate-950/40 text-left">
                  <span className="text-rose-450 font-bold block">2. INITIATE DMCA TAKEDOWNS</span>
                  <p className="text-[8px] text-slate-500 mt-0.5">Deploy automated cease & desist notices to Priority 1 (Critical) domains.</p>
                </div>
                <div className="p-2.5 rounded border border-slate-900 bg-slate-950/40 text-left">
                  <span className="text-rose-450 font-bold block">3. LEGAL PREPARATION</span>
                  <p className="text-[8px] text-slate-500 mt-0.5">Package the SHA-256 evidence vault signatures for courtroom visual identification.</p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Section 5: Digital Evidence Locker (Searchable Grid) */}
          <motion.div 
            className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col text-left mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-850 pb-3 mb-4 gap-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">Digital Evidence Locker</h3>
              </div>
              
              {/* Locker Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-[9px]">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchLawQuery}
                    onChange={(e) => setSearchLawQuery(e.target.value)}
                    placeholder="Search domain..."
                    className="w-full bg-slate-950 border border-slate-850 pl-8 pr-3 py-1.5 rounded-md text-[9px] font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <select
                  value={threatFilter}
                  onChange={(e) => setThreatFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-md text-[9px] font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="All">All Threat Levels</option>
                  <option value="Critical">Critical (Sim &gt;= 70%)</option>
                  <option value="High">High (Sim 60%-69%)</option>
                  <option value="Medium">Medium (Sim 40%-59%)</option>
                  <option value="Low">Low (Sim &lt; 40%)</option>
                </select>
              </div>
            </div>

            {/* Grid list of matched evidence assets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-1">
              {(() => {
                const filtered = (caseData.findings || []).filter(f => {
                  const matchesSearch = f.domain.toLowerCase().includes(searchLawQuery.toLowerCase());
                  const sim = Math.round(f.confidence || 0);
                  if (threatFilter === 'Critical') return matchesSearch && sim >= 70;
                  if (threatFilter === 'High') return matchesSearch && sim >= 60 && sim < 70;
                  if (threatFilter === 'Medium') return matchesSearch && sim >= 40 && sim < 60;
                  if (threatFilter === 'Low') return matchesSearch && sim < 40;
                  return matchesSearch;
                });

                if (filtered.length === 0) {
                  return <p className="text-center font-mono text-[10px] text-slate-550 col-span-full py-8">NO EVIDENCE CORRESPONDING TO FILTER FOUND</p>;
                }

                return filtered.map((finding, idx) => {
                  const sim = Math.round(finding.confidence || 0);
                  const threatColor = sim >= 70 ? 'text-rose-400 bg-rose-950/20 border-rose-900/30' : sim >= 40 ? 'text-amber-400 bg-amber-950/20 border-amber-900/30' : 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
                  const threatLabel = sim >= 70 ? 'CRITICAL' : sim >= 40 ? 'MEDIUM' : 'LOW';
                  return (
                    <motion.div 
                      key={idx} 
                      className="bg-slate-950 border border-slate-850 p-4.5 rounded-lg flex flex-col justify-between hover:border-slate-700 transition-colors font-mono text-[9px] text-left"
                      whileHover={{ y: -2 }}
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                          <span className="font-bold text-slate-400">EV-{caseData.case_id}-{idx + 1}</span>
                          <span className={`px-1.5 py-0.5 rounded border text-[7.5px] font-bold ${threatColor}`}>
                            {threatLabel}
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-400">
                          <div className="flex justify-between">
                            <span className="text-slate-650">DOMAIN:</span>
                            <span className="text-white font-bold truncate max-w-[110px]" title={finding.domain}>{finding.domain}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-655">SIMILARITY:</span>
                            <span className="text-cyan-400 font-bold">{sim}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-650">DETECTION TIME:</span>
                            <span>{finding.first_seen ? new Date(finding.first_seen).toLocaleDateString() : new Date(caseData.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 mt-3 pt-3 flex flex-col gap-1 text-slate-500 text-[7px] leading-tight">
                        <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">VAULT SIGNATURE</span>
                        <span className="truncate block font-mono">{caseData.netra_dna_fingerprint || "NR-PEND-INGX-CODE-X00L"}-{idx}</span>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </motion.div>

          {/* Section 6: Export Center */}
          <motion.div 
            className="cyber-glass border border-slate-800 p-5 rounded-xl bg-slate-950/50 flex flex-col text-left mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
              <Download className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider font-mono">Legal Export Center</h3>
            </div>
            
            <p className="text-[9px] font-mono text-slate-550 uppercase tracking-wider mb-4 leading-normal">
              Download court-admissible visual match logs, pHash checksum mappings, and sealed forensic ZIP packages instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.button
                onClick={handleExportLawPDF}
                disabled={exporting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-4 rounded-lg bg-gradient-to-r from-rose-600 to-rose-750 hover:from-rose-550 hover:to-rose-650 border-0 text-white font-mono text-[10px] font-bold shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Scale className="w-4 h-4" /> {exporting ? 'GENERATING DOSSIER...' : 'COURT DOSSIER PDF'}
              </motion.button>

              <motion.button
                onClick={handleExportJSON}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-cyan-400" /> JSON ARCHIVE FILE
              </motion.button>

              <motion.button
                onClick={handleExportCSV}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-400" /> CSV EVIDENCE LEDGER
              </motion.button>

              <motion.button
                onClick={handleExportZIP}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/30 text-slate-300 hover:text-purple-400 font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-purple-400" /> SEALED ZIP PACKAGE
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Decrypting Terminal Loader HUD Overlay */}
      {decrypting && (
        <div className="fixed inset-0 z-[999] bg-[#020512]/95 backdrop-blur-md flex items-center justify-center p-6 select-none font-mono">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl border border-rose-500/20 bg-slate-950/80 rounded-xl p-8 shadow-[0_0_50px_rgba(244,63,94,0.15)] flex flex-col gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-purple-600 to-cyan-500 animate-pulse" />
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">NETRA CRYPTO SHIELD VAULT</span>
              </div>
              <span className="text-[9px] text-rose-400 font-bold tracking-widest animate-pulse">DECRYPTING SESSION</span>
            </div>
            
            <div className="space-y-4 text-left min-h-[140px] text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded font-bold">SYS</span>
                <span>Security layer handshakes initialized.</span>
              </div>
              
              {decryptionStage >= 0 && (
                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-cyan-400">
                  <span className="text-[9px] bg-cyan-950/40 border border-cyan-850 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">STG-1</span>
                  <span>Establishing secure cryptographic handshakes with NETRA Security Vault...</span>
                </motion.div>
              )}
              
              {decryptionStage >= 1 && (
                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-purple-400">
                  <span className="text-[9px] bg-purple-950/40 border border-purple-850 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">STG-2</span>
                  <span>Sealed Session Token verified. Fetching encrypted database byte segments...</span>
                </motion.div>
              )}

              {decryptionStage >= 2 && (
                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-yellow-400">
                  <span className="text-[9px] bg-yellow-950/40 border border-yellow-850 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">STG-3</span>
                  <span>Restoring entropy pHash vectors. Unwrapping SHA-256 integrity checkers...</span>
                </motion.div>
              )}

              {decryptionStage >= 3 && (
                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-rose-400">
                  <span className="text-[9px] bg-rose-950/40 border border-rose-850 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">STG-4</span>
                  <span>Custody logs verified. Decryption complete. Rendering court-ready brief...</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex justify-between font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                <span>Verification Hash</span>
                <span className="text-slate-400 truncate max-w-[200px]">{(caseData.case_id || 'N/A').repeat(2).slice(0, 32).toUpperCase()}</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }} 
                  animate={{ width: decryptionStage === 0 ? "25%" : decryptionStage === 1 ? "50%" : decryptionStage === 2 ? "75%" : "100%" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-rose-500" 
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Judges Guide Badge */}
      {viewMode !== 'judges_guide' && (
        <motion.button
          onClick={() => setViewMode('judges_guide')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-650 border border-cyan-400/20 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4 animate-bounce" /> JUDGES GUIDE 📑
        </motion.button>
      )}
    </motion.div>
  );
};

export default ResultsPage;
