import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ScenarioDetailClient } from '@/domains/journeys/components/ScenarioDetailClient';
import { isValidIdSegment } from '@/lib/routeValidation';

export const metadata: Metadata = {
  title: '시나리오 상세'
};

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidIdSegment(id)) {
    notFound();
  }

  return <ScenarioDetailClient scenarioId={id} />;
}
