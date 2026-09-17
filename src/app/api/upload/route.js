import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const jobId = formData.get('jobId');
    const files = formData.getAll('resumes');

    if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: 'No resume files provided' }, { status: 400 });

    // dynamic import to avoid edge runtime issues
    const pdfParse = (await import('pdf-parse')).default;

    const results = [];

    for (const file of files) {
      if (!file.name.endsWith('.pdf')) {
        results.push({ file: file.name, status: 'skipped', reason: 'Not a PDF' });
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        const resumeText = pdfData.text.trim();

        const [candidate] = await sql`
          INSERT INTO candidates (job_id, resume_text, status)
          VALUES (${parseInt(jobId)}, ${resumeText}, 'pending')
          RETURNING id, job_id, status, created_at
        `;

        results.push({ file: file.name, status: 'uploaded', candidateId: candidate.id });
      } catch {
        results.push({ file: file.name, status: 'failed', reason: 'PDF parse error' });
      }
    }

    const uploaded = results.filter((r) => r.status === 'uploaded').length;
    return NextResponse.json({ results, uploaded, total: files.length });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
