import { create } from 'zustand';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  bookId?: string;
  bookTitle?: string;
  characterChanges?: string | null;
  eventAlterations?: string | null;
  settingModifications?: string | null;
  characters: string[];
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScenarioState {
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  loading: boolean;
  error: string | null;
  
  setScenarios: (scenarios: Scenario[]) => void;
  setCurrentScenario: (scenario: Scenario | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: [],
  currentScenario: null,
  loading: false,
  error: null,

  setScenarios: (scenarios) => set({ scenarios }),
  setCurrentScenario: (currentScenario) => set({ currentScenario }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
