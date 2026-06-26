import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderSearch, PlusCircle, Search, Filter, Loader2 } from 'lucide-react';
import client from '../api/client';
import CaseCard from '../components/CaseCard';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

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
    const matchesSearch = searchTerm === '' || 
      (c.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.case_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'completed' && (c.status === 'completed' || c.status === 'done')) ||
      (filterStatus === 'processing' && (c.status === 'processing' || c.status === 'investigating')) ||
      (filterStatus === 'active' && !['completed', 'done', 'processing', 'investigating', 'failed'].includes(c.status));
    
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: cases.length,
    completed: cases.filter(c => c.status === 'completed' || c.status === 'done').length,
    processing: cases.filter(c => c.status === 'processing' || c.status === 'investigating').length,
    active: cases.filter(c => !['completed', 'done', 'processing', 'investigating', 'failed'].includes(c.status)).length,
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <FolderSearch className="w-6 h-6 text-cyan-400" />
            Investigations
          </h1>
          <p className="text-sm text-gray-500">
            {cases.length} total investigation{cases.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          onClick={() => navigate('/cases/new')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl cyber-btn-solid text-sm font-semibold"
        >
          <PlusCircle className="w-4 h-4" />
          New Investigation
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cases..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl cyber-input text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'processing', 'active'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'glass text-gray-500 hover:text-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-gray-600">({statusCounts[status] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading investigations...</p>
          </div>
        </div>
      ) : filteredCases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <FolderSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-1">
            {searchTerm || filterStatus !== 'all' ? 'No cases match your filters' : 'No investigations yet'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Start your first investigation by uploading an image'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <motion.button
              onClick={() => navigate('/cases/new')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-xl cyber-btn text-sm font-medium"
            >
              Start Investigation
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c, i) => (
            <CaseCard key={c.case_id} caseData={c} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
