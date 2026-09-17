import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { analyzeResume } from '@/lib/groq';

export async function POST(req) {
  try {
    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    const [job] = await sql`SELECT * FROM job_descriptions WHERE id = ${parseInt(jobId)}`;
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const pending = await sql`
      SELECT id, resume_text FROM candidates
      WHERE job_id = ${parseInt(jobId)} AND status = 'pending'
    `;

    if (!pending.length) {
      return NextResponse.json({ message: 'No pending resumes to analyze', analyzed: 0 });
    }

    const analyzed = [];

    for (const candidate of pending) {
      try {
        const result = await analyzeResume(
          candidate.resume_text,
          job.description,
          job.requirements,
          job.skills_required
        );

        const [updated] = await sql`
          UPDATE candidates SET
            name          = ${result.name},
            email         = ${result.email},
            phone         = ${result.phone},
            skills        = ${JSON.stringify(result.skills)},
            experience    = ${result.experience},
            education     = ${result.education},
            score         = ${result.score},
            strengths     = ${JSON.stringify(result.strengths)},
            weaknesses    = ${JSON.stringify(result.weaknesses)},
            fit_reason    = ${result.fitReason ?? ''},
            best_fit_role = ${result.bestFitRole ?? ''},
            status        = 'analyzed'
          WHERE id = ${candidate.id}
          RETURNING *
        `;

        analyzed.push(updated);
      } catch (err) {
        console.error(`Failed to analyze candidate ${candidate.id}:`, err);
      }
    }

    // Recalculate rankings for all analyzed candidates in this job
    const all = await sql`
      SELECT id FROM candidates
      WHERE job_id = ${parseInt(jobId)} AND status != 'pending'
      ORDER BY score DESC
    `;

    for (let i = 0; i < all.length; i++) {
      await sql`UPDATE candidates SET ranking = ${i + 1} WHERE id = ${all[i].id}`;
    }

    return NextResponse.json({ analyzed: analyzed.length, total: pending.length });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
