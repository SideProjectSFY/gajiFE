import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthGate } from '@/domains/journeys/components/AuthGate';
import { isValidUsernameSegment } from '@/lib/routeValidation';
import { ProfileClient } from '@/domains/catalog/components/ProfileClient';

export const metadata: Metadata = {
  title: '프로필'
};

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  if (!isValidUsernameSegment(username)) {
    notFound();
  }

  return (
    <AuthGate>
      <ProfileClient username={username} />
    </AuthGate>
  );
}
