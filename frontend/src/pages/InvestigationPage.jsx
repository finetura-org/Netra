import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ShieldAlert, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

const InvestigationPage = ({ navigateTo }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file format. Supported types: JPEG, PNG, WEBP, GIF, BMP, TIFF.');
      return false;
    }
    const maxBytes = 20 * 1024 * 1024; // 20MB
    if (selectedFile.size > maxBytes) {
      setError('File size exceeds the maximum 20MB limit.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setError(null);
  };

  const startUploadAndInvestigation = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/cases/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadResult(response.data);
      setTimeout(() => {
        navigateTo('live-process', response.data.case_id);
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.detail || 
        "Failed to upload image. Verify that the backend service is operational."
      );
      setUploading(false);
    }
  };

  // Motion variants
  const elementVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      className="w-full max-w-xl mx-auto flex flex-col min-h-[70vh] justify-center items-center"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Back button */}
      <motion.button 
        onClick={() => navigateTo('home')}
        variants={elementVariants}
        whileHover={{ x: -4 }}
        className="self-start flex items-center gap-2 text-xs text-cyber-blue font-mono hover:text-cyber-green transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> RETURN TO CONSOLE
      </motion.button>

      {/* Main Curved Rectangle Box */}
      <motion.div 
        className="cyber-glass w-full rounded-xl p-8 relative overflow-hidden border border-slate-800"
        variants={elementVariants}
      >
        <div className="text-left mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            SUBMIT EVIDENCE IMAGE
          </h2>
          <p className="text-xs text-slate-400">
            Select a file to run visual database tracing and metadata analytics
          </p>
        </div>

        {/* Curved Rectangle Drag and Drop Zone */}
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="dropzone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className={`w-full h-64 rounded-xl flex flex-col justify-center items-center p-6 cursor-pointer transition-all duration-200 formal-upload-zone ${
                dragActive ? 'formal-upload-zone-active scale-[0.99]' : 'hover:border-cyber-blue/50 hover:bg-[#070b19]/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              
              <motion.div 
                className="p-3.5 rounded-full border border-slate-800 bg-[#070b19] mb-4 text-cyber-blue"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="w-8 h-8" />
              </motion.div>

              <p className="text-sm font-semibold text-slate-200 mb-1">
                Drag & Drop Image Here
              </p>
              <p className="text-xs text-slate-500">
                or click to browse local folders
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-8">
                MAX SIZE: 20MB • JPEG, PNG, WEBP, GIF, BMP, TIFF
              </p>
            </motion.div>
          ) : (
            /* File Preview and Details */
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full border border-slate-800 bg-[#070b19]/45 rounded-xl p-5 relative"
            >
              <motion.button 
                onClick={clearFile}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="absolute top-3 right-3 p-1.5 border border-slate-800 hover:border-cyber-red/30 hover:bg-cyber-red/5 rounded-lg text-slate-400 hover:text-cyber-red transition-all cursor-pointer"
                title="Remove file"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </motion.button>

              <div className="flex flex-col sm:flex-row gap-5 items-center">
                {/* Image Preview */}
                <div className="w-28 h-28 rounded-lg overflow-hidden border border-slate-800 bg-[#02050b] flex items-center justify-center relative shrink-0">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* File Info */}
                <div className="flex-1 w-full text-left font-mono text-xs">
                  <p className="text-sm font-bold text-white truncate mb-2" title={file.name}>
                    {file.name}
                  </p>
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <p>SIZE: <span className="text-slate-300">{(file.size / (1024 * 1024)).toFixed(2)} MB</span></p>
                    <p>TYPE: <span className="text-slate-300">{file.type}</span></p>
                    <p className="flex items-center gap-1">
                      METADATA: <span className="text-cyber-green flex items-center gap-0.5"><Sparkles className="w-3.5 h-3.5" /> EXIF SANITIZED</span>
                    </p>
                  </div>
                </div>
              </div>

              {uploadResult && (
                <div className="mt-4 p-3 bg-cyber-green/5 border border-cyber-green/20 rounded-lg flex items-center gap-2 text-xs text-cyber-green font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>CASE INDEXED: {uploadResult.case_id}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message Box */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 p-4 border border-cyber-red/20 bg-cyber-red/5 rounded-lg flex items-start gap-3 text-xs text-cyber-red font-mono"
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-bold uppercase tracking-wider mb-0.5">Ingestion Failure</p>
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {/* Start Investigation Trigger Button */}
        {file && (
          <div className="mt-6 text-center">
            <motion.button
              onClick={startUploadAndInvestigation}
              disabled={uploading}
              whileHover={{ 
                scale: 1.015,
                boxShadow: "0 4px 20px rgba(2, 132, 199, 0.3)",
              }}
              whileTap={{ scale: 0.985 }}
              className={`formal-btn w-full py-3.5 rounded-lg cursor-pointer ${uploading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-t-white border-white/20 rounded-full animate-spin" />
                  UPLOADING FORENSIC SAMPLE...
                </span>
              ) : (
                "START INVESTIGATION"
              )}
            </motion.button>
          </div>
        )}
      </motion.div>

      <div className="mt-4 flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
        <span>SECURITY STANDARD: ISO/IEC 27037</span>
        <span>•</span>
        <span>EXIF STRIP ACTIVE</span>
      </div>
    </motion.div>
  );
};

export default InvestigationPage;
