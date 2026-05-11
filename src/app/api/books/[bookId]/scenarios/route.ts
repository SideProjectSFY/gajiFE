import { NextResponse } from 'next/server';
import { proxyToSpringApiV1 } from '@/lib/springProxy';
import { isJourneyRollbackEnabled } from '@/lib/rollback';

export async function GET(request: Request, context: { params: Promise<{ bookId: string }> }) {
  if (isJourneyRollbackEnabled('scenario', request.headers.get('cookie'))) {
    return NextResponse.json(
      { message: 'Scenario gateway rollback is enabled' },
      { status: 503, headers: { 'x-journey-rollback': 'scenario' } }
    );
  }

  const { bookId } = await context.params;
  return proxyToSpringApiV1(request, `/books/${bookId}/scenarios`);
}
