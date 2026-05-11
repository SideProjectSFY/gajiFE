import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthGate } from '@/domains/journeys/components/AuthGate';
import { ConversationDetailClient } from '@/domains/journeys/components/ConversationDetailClient';
import { isValidIdSegment } from '@/lib/routeValidation';

export const metadata: Metadata = {
  title: '대화 상세'
};

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidIdSegment(id)) {
    notFound();
  }

  return (
    <AuthGate>
      <ConversationDetailClient conversationId={id} />
    </AuthGate>
  );
}
