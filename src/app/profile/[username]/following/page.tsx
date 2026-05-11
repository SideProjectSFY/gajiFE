import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthGate } from '@/domains/journeys/components/AuthGate';
import { FollowListClient } from '@/domains/journeys/components/FollowListClient';
import { isValidUsernameSegment } from '@/lib/routeValidation';

export const metadata: Metadata = {
  title: '팔로잉'
};

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  if (!isValidUsernameSegment(username)) {
    notFound();
  }

  return (
    <AuthGate>
      <FollowListClient username={username} mode='following' />
    </AuthGate>
  );
}
