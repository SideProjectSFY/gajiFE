import { NextResponse } from 'next/server';
import { requestAiCompletion } from '@/domains/ai/services/requestAiCompletion';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt: string };
    const result = await requestAiCompletion(request, body.prompt);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      const message = await error.text().catch(() => 'Failed to request AI completion');
      return NextResponse.json({ message }, { status: error.status });
    }
    return NextResponse.json({ message: 'Failed to request AI completion' }, { status: 500 });
  }
}
