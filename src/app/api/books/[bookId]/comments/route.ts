import { NextResponse } from 'next/server';
import { proxyToSpringApiV1 } from '@/lib/springProxy';
import { isJourneyRollbackEnabled } from '@/lib/rollback';

async function handler(request: Request, context: { params: Promise<{ bookId: string }> }) {
  if (isJourneyRollbackEnabled('social', request.headers.get('cookie'))) {
    return NextResponse.json(
      { message: 'Social gateway rollback is enabled' },
      { status: 503, headers: { 'x-journey-rollback': 'social' } }
    );
  }

  const { bookId } = await context.params;
  return proxyToSpringApiV1(request, `/books/${bookId}/comments`);
}

export { handler as GET, handler as POST };
