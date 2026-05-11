import { NextResponse } from 'next/server';
import { proxyToSpringApiV1 } from '@/lib/springProxy';
import { isJourneyRollbackEnabled } from '@/lib/rollback';

async function handler(request: Request, context: { params: Promise<{ commentId: string }> }) {
  if (isJourneyRollbackEnabled('social', request.headers.get('cookie'))) {
    return NextResponse.json(
      { message: 'Social gateway rollback is enabled' },
      { status: 503, headers: { 'x-journey-rollback': 'social' } }
    );
  }

  const { commentId } = await context.params;
  return proxyToSpringApiV1(request, `/comments/${commentId}`);
}

export { handler as PUT, handler as DELETE };
