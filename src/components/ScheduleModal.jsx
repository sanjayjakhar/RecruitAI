'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, X, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScheduleModal({ candidate, jobId, onClose, onScheduled }) {
  const [form, setForm] = useState({
    scheduledDate: candidate.scheduled_date?.slice(0, 10) ?? '',
    scheduledTime: candidate.scheduled_time ?? '10:00',
    duration: 60,
    interviewType: 'online',
    meetingLink: candidate.meeting_link ?? '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.scheduledDate || !form.scheduledTime) {
      return toast.error('Date and time are required');
    }
    setSaving(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, jobId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Interview scheduled successfully!');
      onScheduled();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule interview');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#021024] via-[#052659] to-[#5483B3] rounded-xl flex items-center justify-center shadow-md shadow-[#052659]/20">
              <Calendar className="w-5 h-5 text-[#C1E8FF]" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Schedule Interview</h2>
              <p className="text-sm text-slate-400">{candidate.name || 'Candidate'}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </motion.button>
        </div>

        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5483B3]/40 focus:border-[#5483B3] text-sm bg-white text-slate-700"
                min={new Date().toISOString().slice(0, 10)}
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time *</label>
              <input
                type="time"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5483B3]/40 focus:border-[#5483B3] text-sm bg-white text-slate-700"
                value={form.scheduledTime}
                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Clock className="w-4 h-4 inline mr-1 text-[#5483B3]" /> Duration (minutes)
            </label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5483B3]/40 focus:border-[#5483B3] text-sm bg-white text-slate-700"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Interview Mode</label>
            <div className="flex gap-3">
              {['online', 'in-person', 'phone'].map((t) => (
                <motion.button
                  key={t}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setForm({ ...form, interviewType: t })}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition capitalize ${
                    form.interviewType === t
                      ? 'border-[#5483B3] bg-[#C1E8FF]/30 text-[#052659] ring-1 ring-[#5483B3]/40'
                      : 'border-slate-200 text-slate-600 hover:border-[#7DA0CA]'
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Meeting Link */}
          {form.interviewType === 'online' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Meeting Link</label>
              <input
                type="url"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white text-slate-700"
                placeholder="https://meet.google.com/xxx or Zoom link..."
                value={form.meetingLink}
                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none bg-white text-slate-700"
              placeholder="Any special instructions for the interviewer..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-medium text-sm"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#021024] via-[#052659] to-[#5483B3] hover:from-[#052659] hover:to-[#5483B3] text-white font-semibold py-2.5 px-4 rounded-xl transition disabled:opacity-60 shadow-md shadow-[#052659]/20 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4 text-[#C1E8FF]" />}
            {saving ? 'Saving...' : 'Schedule'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
