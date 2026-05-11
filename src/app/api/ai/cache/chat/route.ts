import { NextResponse } from 'next/server';

const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${AI_BASE_URL}/api/ai/cache/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ detail }, { status: 500 });
  }
}
