'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, X, Loader2, Send, Calendar, Link } from 'lucide-react';
import toast from 'react-hot-toast';

const EMAIL_TYPES = [
  { value: 'interview', label: 'Interview Invitation', desc: 'Send interview schedule details' },
  { value: 'shortlist', label: 'Shortlist Notification', desc: 'Notify candidate of shortlisting' },
  { value: 'custom', label: 'Custom Message', desc: 'Write your own message' },
];

export default function EmailModal({ candidates, jobId, onClose, onSent }) {
  const [emailType, setEmailType] = useState('interview');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [interviewLink, setInterviewLink] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (emailType === 'custom' && !customMessage.trim()) {
      return toast.error('Please write a message');
    }
    if (emailType === 'interview' && !interviewDate) {
      return toast.error('Please select an interview date');
    }

    const withEmail = candidates.filter((c) => c.email);
    if (!withEmail.length) {
      return toast.error('None of the selected candidates have email addresses');
    }

    if (!withEmail.length && candidates.length) {
      toast.error(`${candidates.length - withEmail.length} candidates have no email — skipping`);
    }

    setSending(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: candidates.map((c) => c.id),
          jobId,
          emailType,
          customSubject,
          customMessage,
          interviewDate,
          interviewTime,
          interviewLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${data.sent}/${data.total} emails sent successfully`);
      onSent();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send emails');
    } finally {
      setSending(false);
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#021024] via-[#052659] to-[#5483B3] rounded-xl flex items-center justify-center shadow-md shadow-[#052659]/20">
              <Mail className="w-5 h-5 text-[#C1E8FF]" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Send Emails</h2>
              <p className="text-sm text-slate-400">To {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
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

        <div className="p-6 space-y-5">
          {/* Recipient List */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Recipients</h3>
            <div className="max-h-28 overflow-y-auto space-y-1.5 scrollbar-thin">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-800">{c.name || 'Unknown'}</span>
                  {c.email ? (
                    <span className="text-slate-400">— {c.email}</span>
                  ) : (
                    <span className="text-red-400 text-xs">No email</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email Type */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Email Type</h3>
            <div className="space-y-2">
              {EMAIL_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    emailType === t.value ? 'border-[#5483B3] bg-[#C1E8FF]/30 ring-1 ring-[#5483B3]/40' : 'border-slate-200 hover:border-[#7DA0CA]'
                  }`}
                >
                  <input
                    type="radio"
                    name="emailType"
                    value={t.value}
                    checked={emailType === t.value}
                    onChange={() => setEmailType(t.value)}
                    className="mt-0.5 accent-[#052659]"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.label}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Interview Date/Time Picker */}
          {emailType === 'interview' && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-indigo-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Interview Schedule
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Time *</label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3" /> Meeting Link (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/... or Zoom link"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white text-slate-700"
                />
              </div>
            </div>
          )}

          {/* Custom Message */}
          {emailType === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white text-slate-700"
                  placeholder="Email subject..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none bg-white text-slate-700"
                  placeholder="Write your message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
            </div>
          )}
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
            onClick={handleSend}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#021024] via-[#052659] to-[#5483B3] hover:from-[#052659] hover:to-[#5483B3] text-white font-semibold py-2.5 px-4 rounded-xl transition disabled:opacity-60 shadow-md shadow-[#052659]/20 text-sm"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[#C1E8FF]" />}
            {sending ? 'Sending...' : 'Send Emails'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
