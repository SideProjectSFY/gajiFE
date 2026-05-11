import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ScenarioFormClient } from '@/domains/journeys/components/ScenarioFormClient';
import { AuthGate } from '@/domains/journeys/components/AuthGate';
import { isValidIdSegment } from '@/lib/routeValidation';

export const metadata: Metadata = {
  title: '시나리오 편집'
};

export default async function ScenarioEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidIdSegment(id)) {
    notFound();
  }

  return (
    <AuthGate>
      <ScenarioFormClient scenarioId={id} />
    </AuthGate>
  );
}
