import { requestJson } from '@/api/http';
import type { PageResponse, Scenario, ScenarioTreeResponse } from '@/domains/journeys/types/core';

export interface CreateScenarioRequest {
  book_id?: string;
  scenario_title?: string;
  title?: string;
  description?: string;
  visibility?: string;
  forkedFromScenarioId?: string | null;
  character_changes?: string | null;
  event_alterations?: string | null;
  setting_modifications?: string | null;
}

// Keep this if needed for creation response specifically, otherwise reuse Scenario
export interface CreateScenarioResponse extends Scenario {
  userId: string; // Ensure this is present
  baseScenarioId?: string;
  parentScenarioId?: string;
  whatIfQuestion?: string;
  isPrivate?: boolean;
  forkCount?: number;
  scenarioType?: 'ROOT' | 'LEAF';
  scenarioCategory?: string;
  bookTitle?: string;
  characterName?: string;
}

export interface ScenarioSearchFilters {
  query?: string;
  category?: string;
  creatorId?: string;
  minQualityScore?: number;
  page?: number;
  size?: number;
  sort?: string;
  filter?: string; // Align with ScenarioSearchParams
}

export function createScenario(data: CreateScenarioRequest): Promise<Scenario> {
    return requestJson<Scenario>('/api/scenarios', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function getScenario(scenarioId: string): Promise<CreateScenarioResponse> {
    return requestJson<CreateScenarioResponse>(`/api/scenarios/${scenarioId}`);
}

export function updateScenario(scenarioId: string, data: Record<string, unknown>): Promise<Scenario> {
    return requestJson<Scenario>(`/api/scenarios/${scenarioId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function getBookScenarios(bookId: string): Promise<Scenario[]> {
    return requestJson<Scenario[]>(`/api/books/${bookId}/scenarios`);
}

export function deleteScenario(scenarioId: string): Promise<void> {
    return requestJson<void>(`/api/scenarios/${scenarioId}`, {
        method: 'DELETE',
    });
}

function toQueryString(params: ScenarioSearchFilters): string {
    const searchParams = new URLSearchParams();
  
    if (params.query) searchParams.set('query', params.query);
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.size !== undefined) searchParams.set('size', String(params.size));
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.filter) searchParams.set('filter', params.filter);
    if (params.category) searchParams.set('category', params.category);
    if (params.creatorId) searchParams.set('creatorId', params.creatorId);
    if (params.minQualityScore !== undefined) searchParams.set('minQualityScore', String(params.minQualityScore));
  
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
}

export function searchScenarios(filters: ScenarioSearchFilters): Promise<PageResponse<Scenario>> {
    return requestJson<PageResponse<Scenario>>(`/api/scenarios/search${toQueryString(filters)}`);
}

export function getScenarioTree(scenarioId: string): Promise<ScenarioTreeResponse> {
    return requestJson<ScenarioTreeResponse>(`/api/scenarios/${scenarioId}/tree`);
}

// Backward compatibility (optional but good)
export const scenarioApi = {
    createScenario,
    getScenario,
    updateScenario,
    getBookScenarios,
    deleteScenario,
    searchScenarios,
    getScenarioTree
};
