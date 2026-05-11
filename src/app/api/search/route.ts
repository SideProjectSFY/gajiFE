import { NextResponse } from 'next/server';
import { proxyToSpringApiV1 } from '@/lib/springProxy';
import { isJourneyRollbackEnabled } from '@/lib/rollback';

export async function GET(request: Request) {
  if (isJourneyRollbackEnabled('search', request.headers.get('cookie'))) {
    return NextResponse.json(
      { message: 'Search gateway rollback is enabled' },
      { status: 503, headers: { 'x-journey-rollback': 'search' } }
    );
  }

  return proxyToSpringApiV1(request, '/search');
}
