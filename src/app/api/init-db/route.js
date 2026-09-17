import { NextResponse } from 'next/server';
import { initDB, resetDB } from '@/lib/db';

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      await resetDB();
      return NextResponse.json({ success: true, message: 'Database reset and initialized successfully' });
    }

    await initDB();
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('DB init error:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
