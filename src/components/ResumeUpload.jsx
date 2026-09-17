'use client';
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, Loader2, Brain, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResumeUpload({ job, onAnalyzed }) {
  const [files, setFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const onDrop = useCallback((accepted) => {
    const pdfs = accepted.filter((f) => f.type === 'application/pdf');
    if (pdfs.length !== accepted.length) toast.error('Only PDF files are accepted');
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...pdfs.filter((f) => !names.has(f.name))];
    });
    setUploadDone(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setFileStatuses((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = async () => {
    if (!files.length) return toast.error('Please add at least one PDF');
    setUploading(true);
    setFileStatuses(files.map((f) => ({ name: f.name, status: 'uploading' })));

    const formData = new FormData();
    formData.append('jobId', String(job.id));
    files.forEach((f) => formData.append('resumes', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const statusMap = {};
      (data.results || []).forEach((r) => { statusMap[r.name] = r; });
      setFileStatuses(files.map((f) => statusMap[f.name] ?? { name: f.name, status: 'failed' }));
      setUploadDone(true);
      toast.success(`${data.uploaded}/${data.total} resumes uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setFileStatuses(files.map((f) => ({ name: f.name, status: 'failed' })));
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${data.analyzed} resumes analyzed!`);
      onAnalyzed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="card-modern p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-[#06B6D4] via-[#0EA5E9] to-[#10B981] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload Resumes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            For position: <span className="font-bold text-[#FF8A3D]">{job.title}</span>
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-[#FF8A3D] bg-[#FFF4E6] dark:bg-orange-950/30 scale-[1.01]'
            : 'border-slate-200 dark:border-white/10 hover:border-[#FFA94D] hover:bg-orange-50/20'
        }`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${
            isDragActive ? 'bg-[#FF8A3D] text-white shadow-md' : 'bg-orange-50 dark:bg-orange-950/40 text-[#FF8A3D]'
          }`}
        >
          <Upload className="w-6 h-6 transition-colors" />
        </motion.div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {isDragActive ? 'Drop PDFs here...' : 'Drag & drop PDF resumes'}
        </p>
        <p className="text-xs text-slate-400 mt-1">or click to browse — multiple files supported</p>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2 overflow-hidden"
          >
            {files.map((file, idx) => {
              const fs = fileStatuses.find((s) => s.name === file.name);
              return (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  exit={{ opacity: 0, x: 8 }}
                  layout
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-slate-700 truncate">{file.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                  {fs?.status === 'uploaded' && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {fs?.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />}
                  {fs?.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  {!fs && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFile(file.name)}
                      className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          disabled={uploading || !files.length || uploadDone}
          className="btn-sunset flex-1 flex items-center justify-center gap-2 font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? files.length : ''} Resume${files.length !== 1 ? 's' : ''}`}
        </motion.button>

        <AnimatePresence>
          {uploadDone && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-violet flex-1 flex items-center justify-center gap-2 font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {analyzing ? 'Analyzing...' : 'Analyze with AI'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
