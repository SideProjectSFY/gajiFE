import { NextResponse } from 'next/server';
import { proxyToSpringApiV1 } from '@/lib/springProxy';
import { isJourneyRollbackEnabled } from '@/lib/rollback';

export async function GET(request: Request, context: { params: Promise<{ username: string }> }) {
  if (isJourneyRollbackEnabled('social', request.headers.get('cookie'))) {
    return NextResponse.json(
      { message: 'Social gateway rollback is enabled' },
      { status: 503, headers: { 'x-journey-rollback': 'social' } }
    );
  }

  const { username } = await context.params;
  return proxyToSpringApiV1(request, `/users/${username}`);
}
