import React, { useState, useEffect, useRef } from 'react';
import { Shield, Eye, Database, Brain, FileText, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';
import api from '../api/client';

const LiveProcessPage = ({ caseId, navigateTo }) => {
  const [status, setStatus] = useState('processing');
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);
  const [simulatedStep, setSimulatedStep] = useState(0);
  const logContainerRef = useRef(null);

  // List of scanning steps to rotate through every 5 seconds to show active system pipeline
  const processSteps = [
    {
      icon: Shield,
      text: 'Scrubbing EXIF metadata headers...',
      color: 'text-cyan-400'
    },
    {
      icon: Brain,
      text: 'Extracting semantic image markers...',
      color: 'text-emerald-400'
    },
    {
      icon: Eye,
      text: 'Querying visual search directories...',
      color: 'text-cyan-400'
    },
    {
      icon: Database,
      text: 'Deduplicating matched database items...',
      color: 'text-purple-400'
    },
    {
      icon: Brain,
      text: 'Computing similarity confidence scores...',
      color: 'text-emerald-400'
    },
    {
      icon: FileText,
      text: 'Synthesizing AI threat reports...',
      color: 'text-cyan-400'
    },
    {
      icon: FileText,
      text: 'Compiling PDF forensics dossier...',
      color: 'text-purple-400'
    }
  ];

  // Rotate through simulated steps every 5 seconds only while scan is in progress
  useEffect(() => {
    if (status !== 'processing' && status !== 'investigating') return;

    const rotationInterval = setInterval(() => {
      setSimulatedStep((prev) => (prev + 1) % processSteps.length);
    }, 5000);

    return () => clearInterval(rotationInterval);
  }, [status]);

  // Poll case details from backend
  useEffect(() => {
    if (!caseId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/cases/${caseId}`);
        const data = response.data;
        setStatus(data.status);
        setTimeline(data.timeline || []);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Error polling case details:", err);
        setError("Telemetry connection interrupted. Attempting link recovery...");
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [caseId]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [timeline]);

  // Determine current active loader details
  const getActiveLoaderDetails = () => {
    if (status === 'failed') {
      return {
        icon: AlertOctagon,
        text: 'Analysis Failed',
        color: 'text-cyber-red'
      };
    }
    
    if (status === 'completed') {
      return {
        icon: CheckCircle2,
        text: 'Analysis Completed',
        color: 'text-cyber-green animate-pulse'
      };
    }

    // Default: return the simulated step details which change every 5 seconds
    return processSteps[simulatedStep];
  };

  const activeLoader = getActiveLoaderDetails();
  const ActiveIcon = activeLoader.icon;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center min-h-[75vh]">
      <div className="cyber-glass w-full rounded-xl p-8 relative overflow-hidden border border-slate-800 flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full border-b border-slate-800 pb-4 mb-8 text-left">
          <h2 className="text-lg font-bold tracking-tight text-white">
            RUNNING DIGITAL TRACING
          </h2>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
            CASE ID: {caseId || 'Pending...'}
          </p>
        </div>

        {/* Central Rotating Loader Ring */}
        <div className="my-6 flex flex-col items-center">
          <div className="loader-circle-container mb-6">
            <div className="loader-outer-ring" />
            <div className="loader-inner-ring" />
            <div className="loader-center-icon">
              <ActiveIcon className={`w-8 h-8 ${activeLoader.color} transition-all duration-300`} />
            </div>
          </div>

          {/* Text beneath the circle: changing every 5 seconds */}
          <p className="text-sm font-semibold text-slate-200 text-center tracking-wide min-h-[24px]">
            {activeLoader.text}
          </p>
        </div>

        {/* Console Log Panel */}
        <div className="w-full bg-[#050814]/80 border border-slate-800 rounded-lg p-4 text-left mt-6">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 mb-3 text-[10px] font-mono text-slate-400">
            <TerminalIcon className="w-4 h-4 text-cyber-blue" />
            <span>TELEMETRY FEED Logs</span>
          </div>
          
          <div 
            ref={logContainerRef}
            className="h-28 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-1.5 text-slate-400"
          >
            {timeline.map((event, idx) => (
              <div key={event.id || idx} className="flex gap-2">
                <span className="text-slate-600 shrink-0">
                  [{new Date(event.timestamp).toLocaleTimeString()}]
                </span>
                <span className={event.event_type.includes('failed') ? 'text-cyber-red' : 'text-slate-300'}>
                  &gt; {event.description}
                </span>
              </div>
            ))}
            
            {status !== 'completed' && status !== 'failed' && (
              <div className="inline-block w-1.5 h-3 bg-cyber-blue animate-pulse ml-1" />
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="w-full mt-4 p-3 bg-cyber-yellow/5 border border-cyber-yellow/20 rounded-lg flex items-center gap-2 text-xs text-cyber-yellow font-mono">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Finish Action Button */}
        {status === 'completed' && (
          <div className="w-full mt-6 animate-pulse">
            <button
              onClick={() => navigateTo('results', caseId)}
              className="formal-btn formal-btn-green w-full py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              VIEW SCAN RESULTS <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="w-full mt-6">
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-3.5 border border-cyber-red/30 hover:bg-cyber-red/5 rounded-lg text-cyber-red font-mono text-xs cursor-pointer transition-colors"
            >
              ABORT CASE PROTOCOL
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const TerminalIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export default LiveProcessPage;
