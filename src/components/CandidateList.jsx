'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Mail, Calendar, Star, ChevronDown,
  CheckCircle, XCircle, Clock, User, Phone, GraduationCap, Briefcase,
  ThumbsUp, ThumbsDown, Target, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const scoreColor = (score) => {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (score >= 60) return 'text-[#E85522] bg-[#FFF4E6] ring-1 ring-[#FFD8A8] dark:bg-[#FF8A3D]/20 dark:text-[#FFA94D] dark:ring-[#FF8A3D]/40';
  if (score >= 40) return 'text-amber-700 bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-300';
  return 'text-rose-700 bg-rose-50 ring-1 ring-rose-300 dark:bg-rose-950/40 dark:text-rose-300';
};

const scoreBar = (score) => {
  if (score >= 80) return 'bg-gradient-to-r from-emerald-400 to-teal-500';
  if (score >= 60) return 'bg-gradient-to-r from-[#FF6B35] to-[#FFA94D]';
  if (score >= 40) return 'bg-gradient-to-r from-amber-400 to-amber-500';
  return 'bg-gradient-to-r from-rose-400 to-rose-500';
};

const rankBadge = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export default function CandidateList({
  candidates, jobId, topN, onStatusChange, onEmailClick, onScheduleClick
}) {
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [updating, setUpdating] = useState(null);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectTopN = () => {
    const top = candidates.slice(0, topN).map((c) => c.id);
    setSelected(new Set(top));
    toast.success(`Top ${topN} selected`);
  };

  const updateStatus = async (candidateId, status) => {
    setUpdating(candidateId);
    try {
      const res = await fetch('/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Candidate ${status}`);
      onStatusChange();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const selectedCandidates = candidates.filter((c) => selected.has(c.id));

  const parseJson = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return [];
  };

  void jobId;

  if (!candidates.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-modern p-14 text-center"
      >
        <div className="w-14 h-14 bg-orange-50 dark:bg-orange-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200 dark:border-orange-800">
          <User className="w-7 h-7 text-[#FF8A3D]" />
        </div>
        <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">No candidates yet</p>
        <p className="text-slate-400 text-xs mt-1">Upload and analyze resumes first</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      className="space-y-3"
    >
      {/* Toolbar */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: -8 },
          visible: { opacity: 1, y: 0 },
        }}
        className="card-modern p-3.5 flex flex-wrap items-center gap-3"
      >
        <span className="text-sm text-slate-500">
          <span className="font-bold text-slate-900 dark:text-white">{candidates.length}</span> candidates
          {selected.size > 0 && <span className="text-[#FF8A3D] font-bold"> · {selected.size} selected</span>}
        </span>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={selectTopN}
          className="btn-sunset flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/25"
        >
          <Trophy className="w-3.5 h-3.5 text-white" /> Top {topN}
        </motion.button>
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, width: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onEmailClick(selectedCandidates)}
                className="btn-violet flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-purple-500/25 whitespace-nowrap"
              >
                <Mail className="w-3.5 h-3.5 text-white" /> Email ({selected.size})
              </motion.button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-2 rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cards */}
      {candidates.map((c) => {
        const skills = parseJson(c.skills);
        const strengths = parseJson(c.strengths);
        const weaknesses = parseJson(c.weaknesses);
        const isExpanded = expanded === c.id;
        const isSelected = selected.has(c.id);

        return (
          <motion.div
            key={c.id}
            layout
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
            }}
            whileHover={{ y: -2 }}
            className={`card-modern ${
              isSelected
                ? 'border-[#FF8A3D] ring-2 ring-[#FFA94D]/30 shadow-lg'
                : ''
            }`}
          >
            {/* Card Header */}
            <div className="p-4 flex items-center gap-3">
              <motion.input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(c.id)}
                whileTap={{ scale: 1.2 }}
                className="w-4 h-4 rounded accent-[#FF8A3D] cursor-pointer flex-shrink-0"
              />

              {/* Rank */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-base font-bold flex-shrink-0 shadow-sm border border-orange-100 dark:border-white/10 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40"
              >
                {c.ranking ? rankBadge(c.ranking) : '–'}
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{c.name || 'Unknown Candidate'}</h3>
                  <AnimatePresence>
                    {c.status === 'shortlisted' && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="badge-emerald text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm"
                      >
                        <Sparkles size={10} className="inline mr-0.5" />Shortlisted
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {c.status === 'rejected' && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full font-bold"
                      >
                        Rejected
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {c.status === 'pending' && (
                    <span className="badge-orange text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm">Pending</span>
                  )}
                  {c.interview_status && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="badge-purple text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Calendar className="w-3 h-3" />
                      {c.scheduled_date
                        ? `${new Date(c.scheduled_date).toLocaleDateString()} ${c.scheduled_time ?? ''}`
                        : 'Interview Scheduled'}
                    </motion.span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {c.email && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {c.email}
                    </span>
                  )}
                  {c.experience && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {c.experience}
                    </span>
                  )}
                </div>
                {/* Score Bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[180px] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className={`h-1.5 rounded-full ${scoreBar(c.score)}`}
                    />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(c.score)}`}
                  >
                    {c.score}/100
                  </motion.span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onScheduleClick(c)}
                  className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Schedule Interview"
                >
                  <Calendar className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onEmailClick([c])}
                  className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateStatus(c.id, c.status === 'shortlisted' ? 'analyzed' : 'shortlisted')}
                  disabled={updating === c.id || c.status === 'pending'}
                  className={`p-2 rounded-lg transition-all ${
                    c.status === 'shortlisted'
                      ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                  }`}
                  title="Shortlist"
                >
                  <CheckCircle className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateStatus(c.id, c.status === 'rejected' ? 'analyzed' : 'rejected')}
                  disabled={updating === c.id || c.status === 'pending'}
                  className={`p-2 rounded-lg transition-all ${
                    c.status === 'rejected'
                      ? 'text-red-500 bg-red-50 hover:bg-red-100'
                      : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                  }`}
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </div>
            </div>

            {/* Expanded */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-50 p-5 space-y-5 bg-slate-50/50 rounded-b-2xl">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                    >
                    {(c.fit_reason || c.best_fit_role) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {c.fit_reason && (
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className={`rounded-xl p-4 border ${c.score >= 60 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
                          >
                            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${c.score >= 60 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {c.score >= 60 ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                              {c.score >= 60 ? 'Why Suitable' : 'Why Not Suitable'}
                            </h4>
                            <p className={`text-sm leading-relaxed ${c.score >= 60 ? 'text-emerald-700' : 'text-red-600'}`}>{c.fit_reason}</p>
                          </motion.div>
                        )}
                        {c.best_fit_role && (
                          <motion.div
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 shadow-sm"
                          >
                            <h4 className="text-xs font-bold text-[#E85522] dark:text-[#FFA94D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-[#FF8A3D]" /> Best Fit Role
                            </h4>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{c.best_fit_role}</p>
                          </motion.div>
                        )}
                      </div>
                    )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#FF8A3D] uppercase tracking-wider mb-2">Skills Extracted</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.length > 0
                            ? skills.map((s, i) => (
                                <motion.span
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 + i * 0.03 }}
                                  className="text-xs bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 px-2.5 py-1 rounded-full font-semibold border border-cyan-200 dark:border-cyan-800 hover:border-[#FF8A3D] hover:bg-orange-50 transition-all cursor-default"
                                >
                                  {s}
                                </motion.span>
                              ))
                            : <span className="text-xs text-slate-400">No skills extracted</span>
                          }
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Education</h4>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-slate-300" />
                          {c.education || 'Not specified'}
                        </p>
                      </div>

                      {strengths.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {strengths.map((s, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.04 }}
                                className="text-sm text-slate-600 flex items-start gap-1.5"
                              >
                                <Star className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /> {s}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {weaknesses.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Gaps</h4>
                          <ul className="space-y-1">
                            {weaknesses.map((w, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.04 }}
                                className="text-sm text-slate-600 flex items-start gap-1.5"
                              >
                                <Clock className="w-3.5 h-3.5 text-red-300 mt-0.5 flex-shrink-0" /> {w}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {c.phone && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact</h4>
                          <p className="text-sm text-slate-600 flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-300" /> {c.phone}
                          </p>
                        </div>
                      )}

                      {c.interview_status && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          className="md:col-span-2 bg-indigo-50 rounded-xl p-4 border border-indigo-100"
                        >
                          <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Interview Details</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {c.scheduled_date && (
                              <p className="text-slate-600 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                {new Date(c.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            )}
                            {c.scheduled_time && (
                              <p className="text-slate-600 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-400" />
                                {c.scheduled_time}
                              </p>
                            )}
                            {c.meeting_link && (
                              <p className="col-span-2">
                                <a
                                  href={c.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline break-all text-sm"
                                >
                                  {c.meeting_link}
                                </a>
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
