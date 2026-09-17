'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobForm({ onJobCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    experienceRequired: '',
    skillsRequired: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and job description are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Job created!');
      onJobCreated(data.job);
      setForm({ title: '', description: '', requirements: '', experienceRequired: '', skillsRequired: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A3D]/40 focus:border-[#FF8A3D] transition-all placeholder:text-slate-400 hover:border-[#FFA94D] bg-white text-slate-800 dark:text-slate-100';

  return (
    <div className="card-modern p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] via-[#FF8A3D] to-[#FFA94D] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Job Position</h2>
          <p className="text-xs text-slate-400 mt-0.5">AI will match resumes to this job description</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Job Title *</label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Senior React Developer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Job Description *</label>
          <textarea
            rows={4}
            className={`${inputCls} resize-none`}
            placeholder="Describe the role, responsibilities, and what success looks like..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Required Skills</label>
            <input
              type="text"
              className={inputCls}
              placeholder="React, Node.js, TypeScript..."
              value={form.skillsRequired}
              onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Experience</label>
            <input
              type="text"
              className={inputCls}
              placeholder="3+ years, Fresher, 2–5 years..."
              value={form.experienceRequired}
              onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Additional Requirements</label>
          <textarea
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Nice-to-have skills, certifications, location preference..."
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="btn-sunset w-full flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
          {loading ? 'Creating...' : 'Create Position'}
        </motion.button>
      </form>
    </div>
  );
}
