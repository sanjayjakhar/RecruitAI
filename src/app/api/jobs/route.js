import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const jobs = await sql`
      SELECT jd.*, COUNT(c.id) as candidate_count
      FROM job_descriptions jd
      LEFT JOIN candidates c ON c.job_id = jd.id
      GROUP BY jd.id
      ORDER BY jd.created_at DESC
    `;
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, description, requirements, experienceRequired, skillsRequired } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const [job] = await sql`
      INSERT INTO job_descriptions (title, description, requirements, experience_required, skills_required)
      VALUES (${title}, ${description}, ${requirements ?? ''}, ${experienceRequired ?? ''}, ${skillsRequired ?? ''})
      RETURNING *
    `;

    return NextResponse.json({ job });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await sql`DELETE FROM job_descriptions WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
