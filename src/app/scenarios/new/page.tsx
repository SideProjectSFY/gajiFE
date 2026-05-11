import type { Metadata } from 'next';
import { ScenarioFormClient } from '@/domains/journeys/components/ScenarioFormClient';
import { AuthGate } from '@/domains/journeys/components/AuthGate';

export const metadata: Metadata = {
  title: '새 시나리오'
};

export default async function ScenarioNewPage({
  searchParams
}: {
  searchParams: Promise<{ forkFrom?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthGate>
      <ScenarioFormClient forkFromScenarioId={params.forkFrom} />
    </AuthGate>
  );
}
