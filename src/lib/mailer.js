import nodemailer from 'nodemailer';

export function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.COMPANY_NAME || 'HR Team'}" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
}

export function buildInterviewEmailHtml(
  candidateName,
  jobTitle,
  interviewDate,
  interviewTime,
  meetingLink,
  companyName
) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body{font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;}
  .wrap{max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);}
  .hdr{background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;padding:32px 28px;}
  .hdr h1{margin:0;font-size:24px;}
  .hdr p{margin:6px 0 0;opacity:.9;font-size:14px;}
  .body{padding:28px;}
  .box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:20px 0;}
  .box p{margin:8px 0;font-size:15px;color:#1e40af;}
  .box strong{color:#1d4ed8;}
  .btn{display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;}
  .footer{background:#f9fafb;padding:16px 28px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>Interview Invitation</h1>
    <p>${companyName} — Recruitment Team</p>
  </div>
  <div class="body">
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>Congratulations! After reviewing your application for <strong>${jobTitle}</strong>, we are pleased to invite you for an interview.</p>
    <div class="box">
      <p><strong>Position:</strong> ${jobTitle}</p>
      <p><strong>Date:</strong> ${interviewDate}</p>
      <p><strong>Time:</strong> ${interviewTime}</p>
      <p><strong>Mode:</strong> Online Interview</p>
      ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color:#2563eb;">${meetingLink}</a></p>` : ''}
    </div>
    <p>Please reply to confirm your availability. If you have any questions, feel free to reach out to our HR team.</p>
    ${meetingLink ? `<a href="${meetingLink}" class="btn">Join Interview</a>` : ''}
    <p>We look forward to speaking with you!</p>
    <p>Best regards,<br/><strong>HR Recruitment Team</strong><br/>${companyName}</p>
  </div>
  <div class="footer">This is an automated message from our recruitment system. Please do not reply directly to this email.</div>
</div>
</body>
</html>`;
}
