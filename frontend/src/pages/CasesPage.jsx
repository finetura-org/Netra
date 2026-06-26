import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, FolderOpen, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../api/client';

const CasesPage = ({ navigateTo }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cases');
      setCases(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading cases:", err);
      setError("Failed to sync case database archive.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCases = () => {
    let list = [...cases];

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.original_filename?.toLowerCase().includes(q) || 
        c.case_id?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      list = list.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort by created date descending
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return list;
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-cyber-blue border-cyber-green/20 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-slate-400 tracking-wider">SYNCING CASE ARCHIVES...</p>
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

  const filteredCases = getFilteredCases();

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
            CASE EVIDENCE ARCHIVES
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
            Browse through historic visual search runs and telemetry reports
          </p>
        </div>
      </header>

      {/* Filter / Search Bar */}
      <div className="cyber-glass rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between mb-6 text-left">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by case ID or file..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#02050b] border border-cyber-blue/20 text-xs rounded-lg py-2.5 pl-9 pr-4 text-slate-200 focus:outline-none focus:border-cyber-blue font-mono"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1 bg-[#02050b] border border-cyber-blue/20 p-1 rounded-lg">
          {['All', 'completed', 'processing', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[10px] font-mono rounded cursor-pointer transition-colors uppercase ${
                statusFilter === st 
                  ? 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/30 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      {filteredCases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-in text-left">
          {filteredCases.map((item) => {
            const isCompleted = item.status === 'completed';
            const isFailed = item.status === 'failed';
            const statusClass = isCompleted 
              ? 'text-cyber-green border-cyber-green/30 bg-cyber-green/5' 
              : isFailed 
              ? 'text-cyber-red border-cyber-red/30 bg-cyber-red/5' 
              : 'text-cyber-blue border-cyber-blue/30 bg-cyber-blue/5 animate-pulse';

            return (
              <div
                key={item.case_id}
                onClick={() => {
                  // Direct navigation to results or live progress depending on status
                  if (item.status === 'processing' || item.status === 'investigating') {
                    navigateTo('live-process', item.case_id);
                  } else {
                    navigateTo('results', item.case_id);
                  }
                }}
                className="cyber-glass rounded-xl p-5 border border-cyber-blue/15 hover:border-cyber-blue/40 hover:bg-cyber-blue/5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Status */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                      {item.case_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${statusClass}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Title / Name */}
                  <h3 className="text-base font-bold text-slate-200 font-orbitron truncate mb-1" title={item.original_filename}>
                    {item.original_filename}
                  </h3>
                  
                  {/* Timestamp */}
                  <p className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-cyber-blue shrink-0" />
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>

                {/* Info footer */}
                <div className="border-t border-cyber-blue/10 pt-4 mt-6 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Findings:</span>
                  <span className={`font-bold ${item.findings_count > 0 ? 'text-cyber-green' : 'text-slate-500'}`}>
                    {item.findings_count} Matches
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-cyber-blue/10 rounded-xl bg-cyber-bg-dark/10 my-auto">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-500">NO CASE ARCHIVES FOUND MATCHING PARAMETERS</p>
        </div>
      )}
    </div>
  );
};

export default CasesPage;
