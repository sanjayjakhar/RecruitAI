import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req) {
  try {
    const {
      candidateId,
      jobId,
      scheduledDate,
      scheduledTime,
      duration,
      interviewType,
      meetingLink,
      notes,
    } = await req.json();

    if (!candidateId || !jobId || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: 'candidateId, jobId, scheduledDate, scheduledTime required' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM interviews WHERE candidate_id = ${parseInt(candidateId)}`;

    let interview;
    if (existing.length > 0) {
      [interview] = await sql`
        UPDATE interviews SET
          scheduled_date = ${scheduledDate},
          scheduled_time = ${scheduledTime},
          duration       = ${duration ?? 60},
          interview_type = ${interviewType ?? 'online'},
          meeting_link   = ${meetingLink ?? ''},
          notes          = ${notes ?? ''},
          status         = 'scheduled'
        WHERE candidate_id = ${parseInt(candidateId)}
        RETURNING *
      `;
    } else {
      [interview] = await sql`
        INSERT INTO interviews (candidate_id, job_id, scheduled_date, scheduled_time, duration, interview_type, meeting_link, notes)
        VALUES (${parseInt(candidateId)}, ${parseInt(jobId)}, ${scheduledDate}, ${scheduledTime}, ${duration ?? 60}, ${interviewType ?? 'online'}, ${meetingLink ?? ''}, ${notes ?? ''})
        RETURNING *
      `;
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    const interviews = await sql`
      SELECT i.*, c.name, c.email, c.score, c.ranking
      FROM interviews i
      JOIN candidates c ON c.id = i.candidate_id
      WHERE i.job_id = ${parseInt(jobId)}
      ORDER BY i.scheduled_date ASC, i.scheduled_time ASC
    `;

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await sql`DELETE FROM interviews WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 });
  }
}
