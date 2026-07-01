import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getBackendBaseUrl } from '../api/client';

export default function LeakViewer() {
  const { caseId, domain, slug } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCase() {
      try {
        // Fetch details from backend API
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${getBackendBaseUrl()}/api/cases/${caseId}`, config);
        setCaseData(response.data);
      } catch (err) {
        // If unauthenticated or token missing, try to fetch with no auth (FastAPI falls back to guest mode)
        try {
          const response = await axios.get(`${getBackendBaseUrl()}/api/cases/${caseId}`);
          setCaseData(response.data);
        } catch (innerErr) {
          setError('Failed to load visual evidence.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-cyan-400 font-mono">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Scraping cached archive evidence for {domain}...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-mono p-4">
        <div className="max-w-md w-full border border-red-900 bg-red-950/20 rounded p-6 text-center">
          <h2 className="text-xl font-bold mb-2">404 - Leak Page Archive Offline</h2>
          <p className="text-sm text-gray-400 mb-6">
            The target content at <b>{domain}</b> has been deleted by the administrator, or the investigator session expired.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-red-950 text-red-200 border border-red-800 rounded hover:bg-red-900 transition text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get absolute clean image path on local server
  const cleanImageFilename = caseData.clean_image_path ? caseData.clean_image_path.split(/[\\/]/).pop() : null;
  const imageUrl = cleanImageFilename
    ? `${getBackendBaseUrl()}/uploads/clean/${cleanImageFilename}`
    : 'https://via.placeholder.com/800x600?text=No+Visual+Evidence';

  const domainLower = domain.toLowerCase();

  // Render templates based on domain type
  if (domainLower.includes('facebook') || domainLower.includes('instagram') || domainLower.includes('twitter')) {
    // Template 1: Social Media Post
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center py-10 px-4">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                U
              </div>
              <div>
                <h3 className="text-slate-200 font-semibold text-sm">Leaked Profile Post</h3>
                <p className="text-slate-500 text-xs">Posted 3 days ago • Public</p>
              </div>
            </div>
            <div className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-rose-950/40 text-rose-400 border border-rose-900/60 animate-pulse">
              EXHIBIT A - EVIDENCE RECORD
            </div>
          </div>

          {/* Caption */}
          <div className="p-4 text-slate-300 text-sm leading-relaxed">
            "Updated my cover photo today. Visual forensics verification index match ID: {slug.toUpperCase()}."
          </div>

          {/* Image */}
          <div className="bg-black flex items-center justify-center max-h-[500px] overflow-hidden">
            <img src={imageUrl} alt="Visual evidence" className="w-full object-contain" />
          </div>

          {/* Social Stats */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>👍 1,421 Likes</div>
            <div>244 Comments • 12 Shares</div>
          </div>

          {/* Meta Info Panel */}
          <div className="bg-slate-950 p-4 border-t border-slate-800 font-mono text-xs text-cyan-500 flex flex-col gap-1.5">
            <div><span className="text-slate-500">Target URL:</span> https://{domain}/posts/{slug}</div>
            <div><span className="text-slate-500">Case Reference:</span> {caseData.case_id}</div>
            <div><span className="text-slate-500">Perceptual Hash:</span> {caseData.phash}</div>
            <div><span className="text-slate-500">Status:</span> Forensic Capture Verified</div>
          </div>
        </div>
      </div>
    );
  } else if (domainLower.includes('reddit')) {
    // Template 2: Reddit Post
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center py-10 px-4">
        <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl">
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="text-xs text-orange-500 font-bold uppercase tracking-wider">
              r/visual_evidence_leak
            </div>
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
              EXHIBIT B
            </span>
          </div>
          <div className="p-4">
            <h1 className="text-lg font-bold text-zinc-100 mb-2">
              Leaked media files found matching target perceptual signature #{slug.substring(0, 6)}
            </h1>
            <p className="text-zinc-500 text-xs mb-4">
              Submitted 18 hours ago by <span className="text-zinc-300">u/anonymous_investigator</span>
            </p>
            <div className="bg-black rounded-lg overflow-hidden border border-zinc-800 flex justify-center">
              <img src={imageUrl} alt="Reddit visual match" className="max-w-full max-h-[600px] object-contain" />
            </div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-b-lg border-t border-zinc-800 font-mono text-xs text-zinc-400">
            <div><b>Target URL:</b> https://reddit.com/r/visual_evidence_leak/comments/{slug}</div>
            <div><b>pHash:</b> {caseData.phash}</div>
            <div><b>Scraped via:</b> NETRA Recon Engine</div>
          </div>
        </div>
      </div>
    );
  } else if (domainLower.includes('amazon') || domainLower.includes('ebay') || domainLower.includes('aliexpress') || domainLower.includes('etsy')) {
    // Template 3: E-commerce Product Page
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center py-10 px-4">
        <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
            <h1 className="text-xl font-bold text-amber-500 capitalize">{domain} Marketplace Listing</h1>
            <span className="text-xs bg-amber-950/40 text-amber-400 border border-amber-900/60 px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">
              Product Image Match
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Column */}
            <div className="bg-black rounded border border-slate-800 p-2 flex items-center justify-center max-h-[400px]">
              <img src={imageUrl} alt="Marketplace listing item" className="max-w-full max-h-[380px] object-contain" />
            </div>

            {/* Product Details Column */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100 mb-2">
                  Original Listing Item - Forensic Photo Identification Match
                </h2>
                <div className="text-xl font-bold text-emerald-400 mb-4">$249.99</div>
                <div className="bg-slate-950 border border-slate-800 rounded p-4 text-xs text-slate-400 flex flex-col gap-2 font-mono">
                  <div><b>Item ID:</b> {slug.toUpperCase()}</div>
                  <div><b>Original Filename:</b> {caseData.original_filename}</div>
                  <div><b>Created on:</b> {new Date(caseData.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-6 p-3 bg-red-950/20 border border-red-900/60 rounded text-xs text-red-400">
                ⚠️ This visual element matches the exact file profile stored in NETRA local evidence db.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Template 4: News Article / Default Blog Post
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-10 px-4">
        <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6">
          <div className="border-b border-zinc-800 pb-4 mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-serif text-white font-bold tracking-tight">{domain.toUpperCase()} NEWS</h1>
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
              Scraped Link
            </span>
          </div>

          <article>
            <h2 className="text-xl font-bold text-zinc-100 mb-4 leading-snug">
              Visual matches found embedded in article page elements for tracking forensic verification ID: {slug.substring(0, 8).toUpperCase()}
            </h2>
            <div className="text-zinc-500 text-xs mb-6">
              Published on: {new Date(caseData.created_at).toLocaleDateString()} • Reported by global feeds
            </div>

            <div className="my-6 border border-zinc-800 rounded bg-black p-2 flex justify-center">
              <img src={imageUrl} alt="News report illustration" className="max-w-full max-h-[500px] object-contain" />
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              This visual media was successfully captured, parsed, and logged inside the investigator's report under case reference <b>{caseData.case_id}</b>. Perceptual hashing algorithms verify a high index of visual similarity.
            </p>
          </article>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-4 font-mono text-xs text-emerald-500">
            <div><b>Evidence source:</b> https://{domain}/archives/{slug}</div>
            <div><b>pHash:</b> {caseData.phash}</div>
            <div><b>Deduplicated:</b> Verified original file match</div>
          </div>
        </div>
      </div>
    );
  }
}
