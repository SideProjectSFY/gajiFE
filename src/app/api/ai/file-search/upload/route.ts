import { NextResponse } from 'next/server';

const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Forward the FormData to the backend
    const response = await fetch(`${AI_BASE_URL}/api/ai/file-search/upload`, {
      method: 'POST',
      body: formData, // FormData automatically sets multipart boundary
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
