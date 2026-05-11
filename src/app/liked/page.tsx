import type { Metadata } from 'next';
import { AuthGate } from '@/domains/journeys/components/AuthGate';
import { LikedConversationsClient } from '@/domains/journeys/components/LikedConversationsClient';

export const metadata: Metadata = {
  title: '좋아요한 대화'
};

export default function LikedPage() {
  return (
    <AuthGate>
      <LikedConversationsClient />
    </AuthGate>
  );
}
