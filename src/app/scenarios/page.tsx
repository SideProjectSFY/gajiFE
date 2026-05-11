import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '@/components/LoadingState';
import { ScenarioListClient } from '@/domains/journeys/components/ScenarioListClient';

export const metadata: Metadata = {
  title: '시나리오'
};

export default function ScenariosPage() {
  return (
    <Suspense fallback={<main className='content-page'><LoadingState /></main>}>
      <ScenarioListClient />
    </Suspense>
  );
}
