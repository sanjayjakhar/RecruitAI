'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Users, Mail, Calendar, Trophy, TrendingUp } from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const scoreColors = (score) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
};

function AnimatedCounter({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value) || 0;
    if (target === 0) { setDisplay(0); return; }
    const duration = 800;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{display}{suffix}</span>;
}

export default function ReportView({ jobId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/report?jobId=${jobId}`)
      .then((r) => r.json())
      .then((data) => setReport(data))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleDownloadPdf = () => {
    if (!report) return;
    const doc = new jsPDF();

    // Top Header Banner with Palette (#021024 -> #052659)
    doc.setFillColor(5, 38, 89);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(193, 232, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HR Recruitment Agent — Final Report', 14, 16);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Position: ${report.job.title}   |   Date: ${new Date().toLocaleDateString()}`, 14, 26);

    // Summary KPI Box
    doc.setFillColor(244, 250, 255);
    doc.roundedRect(14, 42, 182, 16, 3, 3, 'F');
    doc.setTextColor(2, 16, 36);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total Applicants: ${report.stats.totalCandidates}    Shortlisted: ${report.stats.shortlisted}    Interviews Scheduled: ${report.stats.interviewsScheduled}    Avg Score: ${report.stats.avgScore}/100`,
      18,
      52
    );

    const tableRows = report.candidates.map((c) => {
      const interview = report.interviews.find((i) => i.candidate_id === c.id);
      return [
        c.ranking ? `#${c.ranking}` : '-',
        c.name || 'Unknown',
        c.email || '-',
        `${c.score}/100`,
        c.experience || '-',
        c.status.toUpperCase(),
        interview ? `${interview.scheduled_date} ${interview.scheduled_time}` : '-',
      ];
    });

    autoTable(doc, {
      startY: 64,
      head: [['Rank', 'Candidate', 'Email', 'Score', 'Experience', 'Status', 'Interview Slot']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 38, 89],
        textColor: [193, 232, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [244, 250, 255],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
      },
    });

    doc.save(`RecruitAI_Report_${report.job.title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownload = () => {
    if (!report) return;

    const rows = report.candidates.map((c) => {
      const interview = report.interviews.find((i) => i.candidate_id === c.id);
      const emailSent = report.emailLogs.some((e) => e.candidate_id === c.id && e.status === 'sent');
      return [
        c.ranking ?? '-',
        c.name || 'Unknown',
        c.email || '-',
        c.score,
        c.experience || '-',
        c.status,
        interview ? `${interview.scheduled_date} ${interview.scheduled_time}` : '-',
        emailSent ? 'Yes' : 'No',
      ];
    });

    const csvHeaders = ['Rank', 'Name', 'Email', 'Score', 'Experience', 'Status', 'Interview', 'Email Sent'];
    const csvContent = [
      `HR Recruitment Report — ${report.job.title}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      csvHeaders.join(','),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.job.title.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-modern p-6 bg-gradient-to-r from-[#021024] via-[#052659] to-[#5483B3] border-0 text-white shadow-xl">
          <div className="skeleton h-6 w-48 bg-white/20 mb-2 rounded" />
          <div className="skeleton h-4 w-32 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-8 w-16 mx-auto mb-2 rounded" />
              <div className="skeleton h-3 w-12 mx-auto rounded" />
            </div>
          ))}
        </div>
        <div className="card-modern p-6">
          <div className="skeleton h-5 w-40 mb-4 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-full mb-2 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!report?.job) return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center text-slate-400 py-12"
    >
      Failed to load report.
    </motion.p>
  );

  const { job, candidates, interviews, emailLogs, stats } = report;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-6"
    >
      {/* Report Header */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: -12, scale: 0.98 },
          visible: { opacity: 1, y: 0, scale: 1 },
        }}
        className="card-modern p-6 bg-gradient-to-r from-[#021024] via-[#052659] to-[#5483B3] border-0 text-white shadow-xl shadow-[#052659]/25"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <FileText className="w-6 h-6 text-[#C1E8FF]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">HR Final Recruitment Report</h2>
              <p className="text-[#C1E8FF] font-medium text-sm">{job.title}</p>
              <p className="opacity-70 text-xs mt-0.5">Generated {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDownloadPdf}
              className="btn-sunset flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> CSV
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {[
          { icon: Users, label: 'Total', value: stats.totalCandidates, grad: 'from-[#06B6D4] to-[#0EA5E9]', glow: 'rgba(6,182,212,0.3)' },
          { icon: TrendingUp, label: 'Analyzed', value: stats.analyzed, grad: 'from-[#6366F1] to-[#8B5CF6]', glow: 'rgba(99,102,241,0.3)' },
          { icon: Trophy, label: 'Shortlisted', value: stats.shortlisted, grad: 'from-[#FF6B35] to-[#FFA94D]', glow: 'rgba(255,107,53,0.35)' },
          { icon: Calendar, label: 'Interviews', value: stats.interviewsScheduled, grad: 'from-[#10B981] to-[#34D399]', glow: 'rgba(16,185,129,0.3)' },
          { icon: Mail, label: 'Emails Sent', value: stats.emailsSent, grad: 'from-[#EC4899] to-[#F43F5E]', glow: 'rgba(236,72,153,0.3)' },
          { icon: TrendingUp, label: 'Avg Score', value: `${stats.avgScore}%`, grad: 'from-[#F59E0B] to-[#FBBF24]', glow: 'rgba(245,158,11,0.3)' },
        ].map(({ icon: Icon, label, value, grad, glow }) => (
          <motion.div
            key={label}
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            whileHover={{ y: -4, boxShadow: `0 14px 28px -6px ${glow}` }}
            className="stat-card"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-gradient-to-br ${grad} text-white shadow-md`}
              style={{ boxShadow: `0 6px 16px -3px ${glow}` }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Rankings Table */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0 },
        }}
        className="card-modern overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Candidate Rankings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Rank', 'Name', 'Score', 'Experience', 'Status', 'Interview', 'Email'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {candidates.map((c, idx) => {
                const interview = interviews.find((i) => i.candidate_id === c.id);
                const emailSent = emailLogs.some((e) => e.candidate_id === c.id && e.status === 'sent');
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.04 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-slate-700">
                      {c.ranking === 1 ? '🥇' : c.ranking === 2 ? '🥈' : c.ranking === 3 ? '🥉' : `#${c.ranking ?? '-'}`}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{c.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{c.email || '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-lg ${scoreColors(c.score)}`}>{c.score}</span>
                      <span className="text-slate-400 text-xs">/100</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{c.experience || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        c.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-600' :
                        c.status === 'rejected'   ? 'bg-red-100 text-red-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs">
                      {interview
                        ? `${new Date(interview.scheduled_date).toLocaleDateString()} ${interview.scheduled_time}`
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {emailSent
                        ? <span className="text-xs text-emerald-600 font-medium">Sent</span>
                        : <span className="text-xs text-slate-300">—</span>}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Interview Schedule */}
      <AnimatePresence>
        {interviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="card-modern overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Interview Schedule
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {interviews.map((i, idx) => (
                <motion.div
                  key={i.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-sm font-bold text-indigo-600">
                    #{i.ranking}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{i.name}</p>
                    <p className="text-xs text-slate-500">{i.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(i.scheduled_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                    <p className="text-xs text-slate-500">{i.scheduled_time} · {i.duration} min · {i.interview_type}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Log */}
      <AnimatePresence>
        {emailLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="card-modern overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" /> Email Activity Log
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {emailLogs.slice(0, 10).map((e, idx) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="px-5 py-3 flex items-center gap-4"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      e.status === 'sent' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {e.status}
                  </motion.span>
                  <span className="text-sm text-slate-700 flex-1">{e.name} — {e.sent_to}</span>
                  <span className="text-xs text-slate-400 capitalize">{e.email_type}</span>
                  <span className="text-xs text-slate-400">{new Date(e.sent_at).toLocaleDateString()}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
