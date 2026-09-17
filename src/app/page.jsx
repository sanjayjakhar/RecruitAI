'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Briefcase, Users, BarChart3, Plus, ChevronRight,
  RefreshCw, Trash2, Clock, Sparkles, Mail,
  PanelLeftClose, PanelLeft, Settings, Moon, Sun,
  Palette, Zap, SlidersHorizontal, Check, Info, ListOrdered
} from 'lucide-react';
import toast from 'react-hot-toast';
import JobForm from '@/components/JobForm';
import ResumeUpload from '@/components/ResumeUpload';
import CandidateList from '@/components/CandidateList';
import EmailModal from '@/components/EmailModal';
import ScheduleModal from '@/components/ScheduleModal';
import ReportView from '@/components/ReportView';

const NAV_ITEMS = [
  { id: 'jobs',       label: 'Positions',     icon: Briefcase, desc: 'Manage jobs & resumes',   from: '#FF6B35', to: '#FFA94D', soft: 'rgba(255,107,53,0.18)' },
  { id: 'candidates', label: 'Candidates',    icon: Users,     desc: 'AI Rankings & shortlist', from: '#6366F1', to: '#8B5CF6', soft: 'rgba(99,102,241,0.18)' },
  { id: 'report',     label: 'Final Report',  icon: BarChart3, desc: 'Analytics & PDF export',  from: '#06B6D4', to: '#10B981', soft: 'rgba(6,182,212,0.18)' },
  { id: 'settings',   label: 'Settings',      icon: Settings,  desc: 'Themes & preferences',    from: '#EC4899', to: '#F43F5E', soft: 'rgba(236,72,153,0.18)' },
];

const ACCENTS = [
  { id: 'sunset',    label: 'Sunset Orange', from: '#FF6B35', to: '#FFA94D' },
  { id: 'violet',    label: 'Electric Violet', from: '#6366F1', to: '#8B5CF6' },
  { id: 'blue',      label: 'Ocean Navy',    from: '#052659', to: '#5483B3' },
  { id: 'emerald',   label: 'Mint Emerald',  from: '#059669', to: '#10B981' },
];

function NavIndicator({ soft }) {
  return (
    <motion.div
      layoutId="nav-pill"
      className="absolute left-1 right-1 top-0 h-full rounded-xl"
      style={{ background: soft }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    />
  );
}

function SettingsCard({
  icon: Icon, title, desc, tint, children,
}) {
  return (
    <motion.div
      variants={{ animate: { opacity: 1, y: 0 } }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="card-modern p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          whileHover={{ rotate: 12, scale: 1.08 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundImage: `linear-gradient(135deg, ${tint}, ${tint}cc)`, boxShadow: `0 8px 20px -6px ${tint}80` }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function ToggleRow({
  icon: Icon, iconClass, title, desc, on, onToggle,
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-slate-100 dark:border-white/5"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${iconClass}`}>
          <Icon size={18} />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className={`w-11 h-6 rounded-full p-1 flex transition-colors ${on ? 'bg-accent-gradient justify-end' : 'bg-slate-300 dark:bg-white/15 justify-start'}`}>
        <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
      </div>
    </motion.button>
  );
}

export default function Home() {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [topN, setTopN] = useState(3);
  const [emailCandidates, setEmailCandidates] = useState(null);
  const [scheduleCanddidate, setScheduleCandidate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredNav, setHoveredNav] = useState(null);

  // ---- Persisted app settings ----
  const [darkMode, setDarkMode] = useState(false);
  const [accent, setAccent] = useState('blue');
  const [animationsOn, setAnimationsOn] = useState(true);
  const [defaultTopN, setDefaultTopN] = useState(3);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hrAgentSettings');
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.darkMode === 'boolean') setDarkMode(s.darkMode);
        if (typeof s.accent === 'string') setAccent(s.accent);
        if (typeof s.animationsOn === 'boolean') setAnimationsOn(s.animationsOn);
        if (typeof s.defaultTopN === 'number') { setDefaultTopN(s.defaultTopN); setTopN(s.defaultTopN); }
        if (typeof s.sidebarOpen === 'boolean') setSidebarOpen(s.sidebarOpen);
      }
    } catch { /* ignore */ }
    setSettingsLoaded(true);
  }, []);

  // Apply + persist settings whenever they change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.setAttribute('data-accent', accent);
    if (!settingsLoaded) return;
    localStorage.setItem('hrAgentSettings', JSON.stringify({ darkMode, accent, animationsOn, defaultTopN, sidebarOpen }));
  }, [darkMode, accent, animationsOn, defaultTopN, sidebarOpen, settingsLoaded]);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const jobList = data.jobs ?? [];
      setJobs(jobList);
      return jobList;
    } catch {
      toast.error('Failed to load jobs');
      return [];
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!selectedJob) return;
    setLoadingCandidates(true);
    try {
      const res = await fetch(`/api/candidates?jobId=${selectedJob.id}`);
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setLoadingCandidates(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchJobs().then((jobList) => {
      if (jobList.length > 0) {
        const savedId = localStorage.getItem('selectedJobId');
        if (savedId) {
          const found = jobList.find((j) => j.id === parseInt(savedId));
          if (found) setSelectedJob(found);
        }
      }
    });
  }, [fetchJobs]);

  useEffect(() => {
    if (selectedJob) {
      localStorage.setItem('selectedJobId', String(selectedJob.id));
      fetchCandidates();
    }
  }, [selectedJob, fetchCandidates]);

  const deleteJob = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this job and all its candidates?')) return;
    try {
      await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
      toast.success('Job deleted');
      if (selectedJob?.id === id) { setSelectedJob(null); setCandidates([]); }
      fetchJobs();
    } catch {
      toast.error('Delete failed');
    }
  };

  const analyzed = candidates.filter((c) => c.status !== 'pending');
  const shortlisted = candidates.filter((c) => c.status === 'shortlisted');

  const pageTitle = tab === 'jobs' ? 'Positions' : tab === 'candidates' ? 'Candidates' : tab === 'report' ? 'Final Report' : 'Settings';
  const pageDesc = tab === 'jobs' ? 'Manage your job listings and upload resumes' : tab === 'candidates' ? 'Review, shortlist, and engage with applicants' : tab === 'report' ? 'Comprehensive hiring summary and analytics' : 'Appearance and preferences';

  return (
    <MotionConfig reducedMotion={animationsOn ? 'never' : 'always'}>
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0a0f1c] flex transition-colors duration-300">
      {/* Background ambient aurora decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Warm Light Orange Glow Orb */}
        <motion.div
          animate={animationsOn ? { scale: [1, 1.25, 1], opacity: [0.35, 0.6, 0.35], x: [0, 20, 0], y: [0, -15, 0] } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-gradient-to-br from-[#FF8A3D]/30 to-[#FFA94D]/20 dark:from-[#FF6B35]/25 dark:to-[#FFA94D]/15 rounded-full blur-3xl"
        />
        {/* Electric Cyan / Ice Blue Orb */}
        <motion.div
          animate={animationsOn ? { scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35], x: [0, -20, 0] } : {}}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -left-32 w-[30rem] h-[30rem] bg-gradient-to-tr from-[#06B6D4]/25 to-[#38BDF8]/20 dark:from-[#06B6D4]/20 dark:to-[#052659]/40 rounded-full blur-3xl"
        />
        {/* Soft Violet High-Tech Orb */}
        <motion.div
          animate={animationsOn ? { scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] } : {}}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/20 rounded-full blur-3xl"
        />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-white/80 dark:bg-[#0d1424]/80 backdrop-blur-xl border-r border-slate-100 dark:border-white/5 z-50 flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-50 dark:border-white/5 flex-shrink-0">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1, transition: { duration: 0.5 } }}
            className="w-8 h-8 bg-accent-gradient rounded-xl flex items-center justify-center flex-shrink-0 shadow-accent"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="font-semibold text-slate-900 text-sm">HR Agent</h1>
                <p className="text-[10px] text-slate-400">AI Recruitment</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-1.5 relative">
          {NAV_ITEMS.map((item) => {
            const { id, label, icon: Icon, desc, from, to, soft } = item;
            const active = tab === id;
            return (
              <div key={id} className="relative">
                {active && <NavIndicator soft={soft} />}
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.96 }}
                  onHoverStart={() => setHoveredNav(id)}
                  onHoverEnd={() => setHoveredNav(null)}
                  onClick={() => setTab(id)}
                  className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors z-10"
                >
                  {/* Colorful icon chip */}
                  <motion.div
                    animate={{ scale: hoveredNav === id || active ? 1.08 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={
                      active
                        ? { backgroundImage: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 6px 16px -4px ${soft.replace('0.13', '0.5')}` }
                        : { background: soft }
                    }
                  >
                    <Icon size={16} className="flex-shrink-0" style={{ color: active ? '#fff' : from }} />
                  </motion.div>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap text-left"
                      >
                        <span className="block" style={{ color: active ? from : undefined }}>
                          <span className={active ? '' : 'text-slate-500 dark:text-slate-400'}>{label}</span>
                        </span>
                        <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500">{desc}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Toggle */}
        <div className="px-2 pb-4 border-t border-slate-50 dark:border-white/5 pt-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-sm"
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Area */}
      <div className={`flex-1 transition-all duration-250 ${sidebarOpen ? 'ml-[220px]' : 'ml-16'}`}>
        {/* Top Bar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="h-14 bg-white/70 dark:bg-[#0d1424]/70 backdrop-blur-xl border-b border-slate-100/50 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors"
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex items-center gap-2.5"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
              <span className="text-sm text-slate-400 font-medium">
                {jobs.length > 0
                  ? `${jobs.length} active position${jobs.length !== 1 ? 's' : ''}`
                  : 'No positions yet'}
              </span>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 25 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-amber-500 dark:text-indigo-300 transition-all"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={darkMode ? 'sun' : 'moon'}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </motion.header>

        {/* Page Content */}
        <main className="p-6 relative">
          {/* Floating page header */}
          <motion.div
            key={tab + '-header'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <motion.div
                key={tab + '-icon'}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${NAV_ITEMS.find((n) => n.id === tab)?.from || '#FF6B35'}, ${NAV_ITEMS.find((n) => n.id === tab)?.to || '#FFA94D'})`,
                  boxShadow: `0 10px 22px -6px ${NAV_ITEMS.find((n) => n.id === tab)?.from || '#FF6B35'}70`,
                }}
              >
                {tab === 'jobs' ? <Briefcase className="w-5 h-5 text-white" /> :
                 tab === 'candidates' ? <Users className="w-5 h-5 text-white" /> :
                 tab === 'report' ? <BarChart3 className="w-5 h-5 text-white" /> :
                 <Settings className="w-5 h-5 text-white" />}
              </motion.div>
              <div>
                <motion.h2
                  key={pageTitle}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xl font-bold text-slate-900"
                >
                  {pageTitle}
                </motion.h2>
                <p className="text-sm text-slate-400 mt-0.5">{pageDesc}</p>
              </div>
            </div>
            {tab === 'jobs' && (
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowJobForm(!showJobForm)}
                className="btn-sunset inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
              >
                <Plus size={16} /> New Position
              </motion.button>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Jobs Tab */}
            {tab === 'jobs' && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Modern Multi-Color Feature Pills */}
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex flex-wrap items-center gap-2.5"
                >
                  <span className="badge-orange text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Sparkles size={12} className="text-[#FF8A3D]" /> Groq AI Engine
                  </span>
                  <span className="badge-cyan text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Zap size={12} className="text-[#06B6D4]" /> Instant Resume Parsing
                  </span>
                  <span className="badge-purple text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Mail size={12} className="text-[#8B5CF6]" /> Automated Nodemailer
                  </span>
                  <span className="badge-emerald text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <BarChart3 size={12} className="text-[#10B981]" /> jsPDF Hiring Dossier
                  </span>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Job List */}
                  <div className="lg:col-span-1 space-y-3">
                    <AnimatePresence mode="wait">
                      {loadingJobs ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3"
                        >
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="card-modern p-4">
                              <div className="skeleton h-4 w-3/4 mb-3" />
                              <div className="skeleton h-3 w-1/2 mb-2" />
                              <div className="skeleton h-3 w-2/3" />
                            </div>
                          ))}
                        </motion.div>
                      ) : jobs.length === 0 ? (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="card-modern p-8 text-center border-dashed"
                        >
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3"
                          >
                            <Briefcase className="w-6 h-6 text-blue-400" />
                          </motion.div>
                          <p className="text-slate-500 text-sm font-medium">No positions yet</p>
                          <p className="text-slate-400 text-xs mt-1">Click &quot;New Position&quot; to get started</p>
                        </motion.div>
                      ) : (
                        <motion.div key="list" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }} className="space-y-2">
                          {jobs.map((job) => (
                            <motion.div
                              key={job.id}
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                              }}
                              whileHover={{ y: -3, boxShadow: '0 8px 25px -8px rgba(0,0,0,0.08)' }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => { setSelectedJob(job); setTab('candidates'); }}
                              className={`card-modern p-4 cursor-pointer group ${
                                selectedJob?.id === job.id
                                    ? 'border-blue-200 ring-2 ring-blue-100 shadow-md'
                                    : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <motion.div
                                      whileHover={{ scale: 1.1 }}
                                      className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"
                                    >
                                      <Briefcase className="w-3.5 h-3.5 text-white" />
                                    </motion.div>
                                    <h3 className="font-medium text-slate-900 truncate text-sm">{job.title}</h3>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-3 ml-9">
                                    <span className="flex items-center gap-1">
                                      <Users size={12} />
                                      {job.candidate_count ?? 0} candidates
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => deleteJob(job.id, e)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </motion.button>
                                  <motion.div
                                    animate={{ x: selectedJob?.id === job.id ? 3 : 0 }}
                                  >
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                  </motion.div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right: Form + Upload */}
                  <div className="lg:col-span-2 space-y-5">
                    <AnimatePresence mode="wait">
                      {showJobForm || jobs.length === 0 ? (
                        <motion.div
                          key="form"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.2 }}
                        >
                          <JobForm
                            onJobCreated={(job) => {
                              setJobs((prev) => [job, ...prev]);
                              setSelectedJob(job);
                              setShowJobForm(false);
                              toast.success('Job created! Now upload resumes →');
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="card-modern p-12 text-center border-dashed"
                        >
                          <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
                          >
                            <Plus className="w-7 h-7 text-slate-300" />
                          </motion.div>
                          <p className="text-slate-400 text-sm">
                            Click <span className="font-medium text-slate-600">New Position</span> to create a listing,
                            or select one to upload resumes.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {selectedJob && (
                        <motion.div
                          key={selectedJob.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 16 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ResumeUpload
                            job={selectedJob}
                            onAnalyzed={() => {
                              setTab('candidates');
                              fetchCandidates();
                              toast.success('Analysis complete! View rankings →');
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Candidates Tab */}
            {tab === 'candidates' && (
              <motion.div
                key="candidates"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-modern p-4 flex flex-wrap items-center gap-4"
                >
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-500">Job:</label>
                    <select
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 min-w-[180px]"
                      value={selectedJob?.id ?? ''}
                      onChange={(e) => {
                        const job = jobs.find((j) => j.id === parseInt(e.target.value));
                        if (job) setSelectedJob(job);
                      }}
                    >
                      <option value="">Select a job...</option>
                      {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <label className="text-sm text-slate-400">Top N:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={topN}
                      onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center bg-white"
                    />
                    <motion.button
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                      onClick={fetchCandidates}
                      className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <RefreshCw size={15} />
                    </motion.button>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {candidates.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      {[
                        { label: 'Total',       value: candidates.length,                       bg: 'badge-cyan font-bold shadow-sm' },
                        { label: 'Analyzed',    value: analyzed.length,                         bg: 'badge-purple font-bold shadow-sm' },
                        { label: 'Shortlisted', value: shortlisted.length,                      bg: 'badge-emerald font-bold shadow-sm' },
                        { label: 'Pending',     value: candidates.length - analyzed.length,     bg: 'badge-orange font-bold shadow-sm' },
                      ].map(({ label, value, bg }, i) => (
                        <motion.span
                          key={label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.2, type: 'spring', stiffness: 300 }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full ${bg}`}
                        >
                          {label}: <span className="tabular-nums">{value}</span>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {!selectedJob ? (
                    <motion.div
                      key="no-job"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="card-modern p-14 text-center"
                    >
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      >
                        <Briefcase className="w-7 h-7 text-slate-300" />
                      </motion.div>
                      <p className="text-slate-500 text-sm font-medium">Select a job to view candidates</p>
                    </motion.div>
                  ) : loadingCandidates ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="card-modern p-5">
                          <div className="flex items-center gap-3">
                            <div className="skeleton w-9 h-9 rounded-xl" />
                            <div className="flex-1">
                              <div className="skeleton h-4 w-1/3 mb-2" />
                              <div className="skeleton h-3 w-1/2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CandidateList
                        candidates={candidates}
                        jobId={selectedJob.id}
                        topN={topN}
                        onStatusChange={fetchCandidates}
                        onEmailClick={(sel) => setEmailCandidates(sel)}
                        onScheduleClick={(c) => setScheduleCandidate(c)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Report Tab */}
            {tab === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-modern p-4 flex items-center gap-4"
                >
                  <label className="text-sm font-medium text-slate-500">Job:</label>
                  <select
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 min-w-[180px]"
                    value={selectedJob?.id ?? ''}
                    onChange={(e) => {
                      const job = jobs.find((j) => j.id === parseInt(e.target.value));
                      if (job) setSelectedJob(job);
                    }}
                  >
                    <option value="">Select a job...</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </motion.div>

                <AnimatePresence mode="wait">
                  {selectedJob ? (
                    <motion.div
                      key={selectedJob.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ReportView jobId={selectedJob.id} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-job"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="card-modern p-14 text-center"
                    >
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      >
                        <BarChart3 className="w-7 h-7 text-slate-300" />
                      </motion.div>
                      <p className="text-slate-500 text-sm font-medium">Select a job to generate the final report</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Settings Tab */}
            {tab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto space-y-5"
                variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
              >
                {/* Appearance */}
                <SettingsCard icon={Palette} title="Appearance" desc="Theme and accent color" tint="#8b5cf6">
                  <ToggleRow
                    icon={darkMode ? Moon : Sun}
                    iconClass={darkMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-amber-100 text-amber-600'}
                    title={darkMode ? 'Dark Mode' : 'Light Mode'}
                    desc={darkMode ? 'Switch to light appearance' : 'Switch to dark appearance'}
                    on={darkMode}
                    onToggle={() => setDarkMode(!darkMode)}
                  />

                  {/* Accent color picker */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-soft text-accent">
                        <Palette size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-800">Accent Color</p>
                        <p className="text-xs text-slate-400 mt-0.5">Personalize highlights & buttons</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ACCENTS.map((a) => (
                        <motion.button
                          key={a.id}
                          whileHover={{ scale: 1.15, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setAccent(a.id)}
                          title={a.label}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                          style={{ backgroundImage: `linear-gradient(135deg, ${a.from}, ${a.to})`, boxShadow: accent === a.id ? `0 0 0 2px #fff, 0 0 0 4px ${a.from}` : 'none' }}
                        >
                          {accent === a.id && <Check size={14} className="text-white" />}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Animations toggle */}
                  <div className="mt-3">
                    <ToggleRow
                      icon={Zap}
                      iconClass="bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300"
                      title="Animations"
                      desc="Enable motion & transitions across the app"
                      on={animationsOn}
                      onToggle={() => setAnimationsOn(!animationsOn)}
                    />
                  </div>
                </SettingsCard>

                {/* Preferences */}
                <SettingsCard icon={SlidersHorizontal} title="Preferences" desc="Defaults for your workflow" tint="#10b981">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                        <ListOrdered size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-800">Default shortlist size</p>
                        <p className="text-xs text-slate-400 mt-0.5">Top candidates to highlight by default</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[3, 5, 10].map((n) => (
                        <motion.button
                          key={n}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => { setDefaultTopN(n); setTopN(n); }}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                            defaultTopN === n
                              ? 'bg-accent-gradient text-white shadow-accent'
                              : 'bg-white dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10 hover:border-accent'
                          }`}
                        >
                          {n}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <ToggleRow
                      icon={sidebarOpen ? PanelLeft : PanelLeftClose}
                      iconClass="bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
                      title="Expanded sidebar"
                      desc="Keep the navigation panel open by default"
                      on={sidebarOpen}
                      onToggle={() => setSidebarOpen(!sidebarOpen)}
                    />
                  </div>
                </SettingsCard>

                {/* About */}
                <SettingsCard icon={Info} title="About" desc="Application information" tint="#3b82f6">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: 'Application', v: 'HR Agent' },
                      { k: 'Version', v: 'v0.1.0' },
                      { k: 'Engine', v: 'Groq AI' },
                      { k: 'Active positions', v: String(jobs.length) },
                    ].map((row) => (
                      <div key={row.k} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">{row.k}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{row.v}</p>
                      </div>
                    ))}
                  </div>
                </SettingsCard>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {emailCandidates && selectedJob && (
          <EmailModal
            candidates={emailCandidates}
            jobId={selectedJob.id}
            onClose={() => setEmailCandidates(null)}
            onSent={fetchCandidates}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scheduleCanddidate && selectedJob && (
          <ScheduleModal
            candidate={scheduleCanddidate}
            jobId={selectedJob.id}
            onClose={() => setScheduleCandidate(null)}
            onScheduled={fetchCandidates}
          />
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}
