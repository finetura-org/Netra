import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, FileText, Search, Loader2 } from 'lucide-react';
import client from '../api/client';
import ReportModal from '../components/ReportModal';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'completed': case 'done': return 'status-completed';
    case 'processing': return 'status-processing';
    case 'failed': return 'status-failed';
    default: return 'status-active';
  }
}

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await client.get('/cases');
      setCases(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.original_filename || '').toLowerCase().includes(term) ||
      (c.case_id || '').toLowerCase().includes(term)
    );
  });

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <FileBarChart className="w-6 h-6 text-cyan-400" />
            Investigation Reports
          </h1>
          <p className="text-sm text-gray-500">
            Export and download investigation reports
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cases..."
            className="pl-10 pr-4 py-2.5 rounded-xl cyber-input text-sm w-full sm:w-64"
          />
        </div>
      </div>

      {/* Cases list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading reports...</p>
          </div>
        </div>
      ) : filteredCases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <FileBarChart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-1">No reports available</p>
          <p className="text-sm text-gray-600">
            {searchTerm ? 'No cases match your search' : 'Complete an investigation to generate reports'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c, index) => {
            const findingCount = c.findings_count ?? c.finding_count ?? c.findings?.length ?? 0;
            
            return (
              <motion.div
                key={c.case_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="glass-card rounded-xl p-5 hover:border-cyan-500/20 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {c.original_filename || `Case ${c.case_id}`}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusClass(c.status)}`}>
                          {c.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>ID: {c.case_id}</span>
                        <span>{formatDate(c.created_at)}</span>
                        <span>{findingCount} finding{findingCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      onClick={() => setSelectedCase(c)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg cyber-btn text-xs font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {selectedCase && (
        <ReportModal
          isOpen={true}
          onClose={() => setSelectedCase(null)}
          caseData={selectedCase}
        />
      )}
    </motion.div>
  );
}
