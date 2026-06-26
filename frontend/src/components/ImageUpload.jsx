import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Upload, Image, X, Check, AlertCircle } from 'lucide-react';

export default function ImageUpload({ onFileSelect, uploading = false, progress = 0 }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    if (dropRef.current) {
      gsap.fromTo(
        dropRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, []);

  const handleFile = useCallback((f) => {
    setError(null);
    if (!f) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(f.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, GIF, BMP)');
      return;
    }

    if (f.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
    onFileSelect?.(f);
  }, [onFileSelect]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect?.(null);
  }, [onFileSelect]);

  return (
    <div ref={dropRef}>
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10 glow-cyan'
                : 'border-gray-700 hover:border-cyan-500/40 hover:bg-cyan-500/5'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            
            <motion.div
              animate={dragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-lg font-medium text-white mb-1">
                {dragActive ? 'Drop image here' : 'Upload Investigation Image'}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-600">
                Supports JPEG, PNG, WebP, GIF, BMP • Max 50MB
              </p>
            </motion.div>

            {/* Animated corner brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500/30 rounded-br-lg" />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-start gap-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white truncate mb-1">{file?.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file?.size / 1024 / 1024).toFixed(2)} MB • {file?.type}
                    </p>
                  </div>
                  {!uploading && (
                    <motion.button
                      onClick={removeFile}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                {/* Upload progress */}
                {uploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-cyan-400 font-medium">Uploading...</span>
                      <span className="text-xs text-gray-500 font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {!uploading && (
                  <div className="flex items-center gap-2 mt-3">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Ready for upload</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
