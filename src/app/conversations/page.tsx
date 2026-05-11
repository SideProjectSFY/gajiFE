import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '@/components/LoadingState';
import { AuthGate } from '@/domains/journeys/components/AuthGate';
import { ConversationListClient } from '@/domains/journeys/components/ConversationListClient';

export const metadata: Metadata = {
  title: '대화'
};

export default function ConversationsPage() {
  return (
    <AuthGate>
      <Suspense fallback={<main className='content-page'><LoadingState /></main>}>
        <ConversationListClient />
      </Suspense>
    </AuthGate>
  );
}
