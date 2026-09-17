import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    const candidates = await sql`
      SELECT
        c.*,
        i.scheduled_date,
        i.scheduled_time,
        i.meeting_link,
        i.status AS interview_status,
        (SELECT COUNT(*) FROM email_logs el WHERE el.candidate_id = c.id) AS email_count
      FROM candidates c
      LEFT JOIN interviews i ON i.candidate_id = c.id
      WHERE c.job_id = ${parseInt(jobId)}
      ORDER BY
        CASE c.status WHEN 'pending' THEN 3 WHEN 'analyzed' THEN 2 ELSE 1 END,
        c.ranking ASC NULLS LAST,
        c.score DESC
    `;

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { candidateId, status } = await req.json();
    if (!candidateId || !status) {
      return NextResponse.json({ error: 'candidateId and status required' }, { status: 400 });
    }

    const [candidate] = await sql`
      UPDATE candidates SET status = ${status}
      WHERE id = ${parseInt(candidateId)}
      RETURNING *
    `;

    // Recompute rankings after status change
    const all = await sql`
      SELECT id FROM candidates WHERE job_id = ${candidate.job_id}
      AND status != 'pending'
      ORDER BY score DESC
    `;
    for (let i = 0; i < all.length; i++) {
      await sql`UPDATE candidates SET ranking = ${i + 1} WHERE id = ${all[i].id}`;
    }

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await sql`DELETE FROM candidates WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
