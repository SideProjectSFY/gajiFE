import { NextResponse } from 'next/server';
import { proxyToSpringApiV1 } from '@/lib/springProxy';
import { isJourneyRollbackEnabled } from '@/lib/rollback';

async function handler(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  if (isJourneyRollbackEnabled('social', request.headers.get('cookie'))) {
    return NextResponse.json(
      { message: 'Social gateway rollback is enabled' },
      { status: 503, headers: { 'x-journey-rollback': 'social' } }
    );
  }

  const { path = [] } = await context.params;
  return proxyToSpringApiV1(request, `/users/${path.join('/')}`.replace(/\/$/, ''));
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
