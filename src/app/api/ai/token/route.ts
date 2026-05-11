import { NextResponse } from 'next/server';
import { issueAiToken } from '@/domains/ai/actions/aiTokenActions';

export async function POST(request: Request) {
  try {
    const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();
    const result = await issueAiToken(request, correlationId);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Failed to issue AI token' }, { status: 500 });
  }
}
