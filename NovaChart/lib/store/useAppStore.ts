import { create } from 'zustand';
import { RateHistory, Goal, Match, Summoner, LeagueEntry } from '@/types';
import { rateHistoryService, goalService, matchService, summonerService } from '@/lib/db';

interface AppState {
  rateHistory: RateHistory[];
  goals: Goal[];
  matches: Match[];
  currentSummoner: Summoner | null;
  currentLeagueEntry: LeagueEntry | null; // Added
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRateHistory: () => Promise<void>;
  addRateHistory: (rate: Omit<RateHistory, 'id'>) => Promise<void>;
  clearRateHistory: () => Promise<void>;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: number, changes: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  loadMatches: () => Promise<void>;
  addMatch: (match: Omit<Match, 'id'>) => Promise<void>;
  setCurrentSummoner: (summoner: Summoner | null) => void;
  setCurrentLeagueEntry: (entry: LeagueEntry | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  rateHistory: [],
  goals: [],
  matches: [],
  currentSummoner: null,
  currentLeagueEntry: null,
  isLoading: false,
  error: null,

  loadRateHistory: async () => {
    try {
      set({ isLoading: true, error: null });
      const history = await rateHistoryService.getAll();
      set({ rateHistory: history, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load rate history',
        isLoading: false,
      });
    }
  },

  addRateHistory: async (rate) => {
    try {
      set({ isLoading: true, error: null });
      // add() method now handles duplicate checking internally
      await rateHistoryService.add(rate);
      await get().loadRateHistory();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add rate history',
        isLoading: false,
      });
    }
  },

  clearRateHistory: async () => {
    try {
      set({ isLoading: true, error: null });
      await rateHistoryService.deleteAll();
      await get().loadRateHistory();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to clear rate history',
        isLoading: false,
      });
    }
  },

  loadGoals: async () => {
    try {
      set({ isLoading: true, error: null });
      const goals = await goalService.getAll();
      set({ goals, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load goals',
        isLoading: false,
      });
    }
  },

  addGoal: async (goal) => {
    try {
      set({ isLoading: true, error: null });
      await goalService.add(goal);
      await get().loadGoals();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add goal',
        isLoading: false,
      });
    }
  },

  updateGoal: async (id, changes) => {
    try {
      set({ isLoading: true, error: null });
      await goalService.update(id, changes);
      await get().loadGoals();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update goal',
        isLoading: false,
      });
    }
  },

  deleteGoal: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await goalService.delete(id);
      await get().loadGoals();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete goal',
        isLoading: false,
      });
    }
  },

  loadMatches: async () => {
    try {
      set({ isLoading: true, error: null });
      const matches = await matchService.getAll();
      set({ matches, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load matches',
        isLoading: false,
      });
    }
  },

  addMatch: async (match) => {
    try {
      set({ isLoading: true, error: null });
      await matchService.add(match);
      await get().loadMatches();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add match',
        isLoading: false,
      });
    }
  },

  setCurrentSummoner: (summoner) => {
    set({ currentSummoner: summoner });
  },

  setCurrentLeagueEntry: (entry) => {
    set({ currentLeagueEntry: entry });
  },

  setError: (error) => {
    set({ error });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

