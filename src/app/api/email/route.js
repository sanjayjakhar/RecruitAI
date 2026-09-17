import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail, buildInterviewEmailHtml } from '@/lib/mailer';

export async function POST(req) {
  try {
    const {
      candidateIds,
      jobId,
      emailType,
      customSubject,
      customMessage,
      interviewDate,
      interviewTime,
      interviewLink,
    } = await req.json();

    if (!candidateIds?.length || !jobId) {
      return NextResponse.json({ error: 'candidateIds and jobId required' }, { status: 400 });
    }

    const [job] = await sql`SELECT * FROM job_descriptions WHERE id = ${parseInt(jobId)}`;
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const companyName = process.env.COMPANY_NAME || 'Our Company';
    const results = [];

    for (const candidateId of candidateIds) {
      const [candidate] = await sql`SELECT * FROM candidates WHERE id = ${parseInt(candidateId)}`;

      if (!candidate?.email) {
        results.push({ candidateId, status: 'failed', reason: 'No email address found in resume' });
        continue;
      }

      let subject = '';
      let html = '';

      if (emailType === 'interview') {
        let dateStr = 'To Be Confirmed';
        let timeStr = 'To Be Confirmed';
        let link = '';

        if (interviewDate) {
          dateStr = new Date(interviewDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          timeStr = interviewTime ?? 'To Be Confirmed';
          link = interviewLink ?? '';
        } else {
          const [interview] = await sql`
            SELECT * FROM interviews WHERE candidate_id = ${parseInt(candidateId)} ORDER BY created_at DESC LIMIT 1
          `;
          if (interview?.scheduled_date) {
            dateStr = new Date(interview.scheduled_date).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            timeStr = interview.scheduled_time ?? 'To Be Confirmed';
            link = interview.meeting_link ?? '';
          }
        }

        subject = `Interview Invitation – ${job.title} | ${companyName}`;
        html = buildInterviewEmailHtml(
          candidate.name || 'Candidate',
          job.title,
          dateStr,
          timeStr,
          link,
          companyName
        );
      } else if (emailType === 'shortlist') {
        subject = `Shortlisted – ${job.title} | ${companyName}`;
        html = `
          <p>Dear ${candidate.name || 'Candidate'},</p>
          <p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of <strong>${job.title}</strong> at ${companyName}.</p>
          <p>Our HR team will reach out soon with further details regarding the next steps.</p>
          <p>Best regards,<br/>HR Team – ${companyName}</p>
        `;
      } else if (emailType === 'custom') {
        subject = customSubject || `Regarding Your Application – ${job.title}`;
        html = `<p>${(customMessage || '').replace(/\n/g, '<br/>')}</p>`;
      }

      try {
        await sendEmail({ to: candidate.email, subject, html });

        await sql`
          INSERT INTO email_logs (candidate_id, job_id, email_type, sent_to, subject, body, status)
          VALUES (${parseInt(candidateId)}, ${parseInt(jobId)}, ${emailType}, ${candidate.email}, ${subject}, ${html}, 'sent')
        `;

        results.push({ candidateId, status: 'sent', email: candidate.email });
      } catch (err) {
        console.error('Email send error:', err);
        await sql`
          INSERT INTO email_logs (candidate_id, job_id, email_type, sent_to, subject, body, status)
          VALUES (${parseInt(candidateId)}, ${parseInt(jobId)}, ${emailType}, ${candidate.email}, ${subject}, ${html}, 'failed')
        `;
        results.push({ candidateId, status: 'failed', reason: 'SMTP send error' });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    return NextResponse.json({ results, sent, total: candidateIds.length });
  } catch (error) {
    console.error('Email route error:', error);
    return NextResponse.json({ error: 'Email operation failed' }, { status: 500 });
  }
}
