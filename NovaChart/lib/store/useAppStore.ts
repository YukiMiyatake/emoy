/**
 * Application Store (Zustand)
 * 
 * ⚠️ CRITICAL: This store ONLY accepts RANKED_SOLO_5x5 (solo queue) league entries.
 * 
 * IMPORTANT: Before modifying this file, read:
 * - docs/development/solo-queue-only-guidelines.md
 * 
 * The setCurrentLeagueEntry function validates that entries are solo queue.
 * This mistake has been made multiple times. DO NOT remove the validation.
 */

import { create } from 'zustand';
import { RateHistory, Goal, Match, Summoner, LeagueEntry } from '@/types';
import { rateHistoryService, goalService, matchService, summonerService } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

type StoreError = unknown;

function handleStoreError(
  set: (partial: Partial<AppState>) => void,
  error: StoreError,
  defaultMessage: string
) {
  const message = error instanceof Error ? error.message : defaultMessage;
  logger.error('[useAppStore] Error:', error);
  set({ error: message, isLoading: false });
}

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

// Selectors
export function useSoloQueueStats() {
  return useAppStore((state) => {
    const entry = state.currentLeagueEntry;
    if (!entry) return null;
    const totalGames = entry.wins + entry.losses;
    const winRate = totalGames > 0 ? Math.round((entry.wins / totalGames) * 100) : 0;
    return {
      queueType: entry.queueType,
      wins: entry.wins,
      losses: entry.losses,
      winRate,
      tier: entry.tier,
      rank: entry.rank,
      leaguePoints: entry.leaguePoints,
    };
  });
}

export function useActiveGoals() {
  return useAppStore((state) => state.goals.filter((g) => g.isActive));
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
      handleStoreError(set, error, 'Failed to load rate history');
    }
  },

  addRateHistory: async (rate) => {
    try {
      set({ isLoading: true, error: null });
      // add() method now handles duplicate checking internally
      await rateHistoryService.add(rate);
      await get().loadRateHistory();
    } catch (error) {
      handleStoreError(set, error, 'Failed to add rate history');
    }
  },

  clearRateHistory: async () => {
    try {
      set({ isLoading: true, error: null });
      await rateHistoryService.deleteAll();
      await get().loadRateHistory();
    } catch (error) {
      handleStoreError(set, error, 'Failed to clear rate history');
    }
  },

  loadGoals: async () => {
    try {
      set({ isLoading: true, error: null });
      const goals = await goalService.getAll();
      set({ goals, isLoading: false });
    } catch (error) {
      handleStoreError(set, error, 'Failed to load goals');
    }
  },

  addGoal: async (goal) => {
    try {
      set({ isLoading: true, error: null });
      await goalService.add(goal);
      await get().loadGoals();
    } catch (error) {
      handleStoreError(set, error, 'Failed to add goal');
    }
  },

  updateGoal: async (id, changes) => {
    try {
      set({ isLoading: true, error: null });
      await goalService.update(id, changes);
      await get().loadGoals();
    } catch (error) {
      handleStoreError(set, error, 'Failed to update goal');
    }
  },

  deleteGoal: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await goalService.delete(id);
      await get().loadGoals();
    } catch (error) {
      handleStoreError(set, error, 'Failed to delete goal');
    }
  },

  loadMatches: async () => {
    try {
      set({ isLoading: true, error: null });
      const matches = await matchService.getAll();
      set({ matches, isLoading: false });
    } catch (error) {
      handleStoreError(set, error, 'Failed to load matches');
    }
  },

  addMatch: async (match) => {
    try {
      set({ isLoading: true, error: null });
      await matchService.add(match);
      await get().loadMatches();
    } catch (error) {
      handleStoreError(set, error, 'Failed to add match');
    }
  },

  setCurrentSummoner: (summoner) => {
    set({ currentSummoner: summoner });
  },

  setCurrentLeagueEntry: (entry) => {
    // ⚠️ CRITICAL: Only allow solo queue (RANKED_SOLO_5x5) entries
    // This check has been missing multiple times. DO NOT REMOVE THIS CHECK.
    // Non-solo queue entries (like RANKED_FLEX_SR) must be rejected.
    // This prevents statistics from including flex queue data.
    if (entry && entry.queueType !== 'RANKED_SOLO_5x5') {
      logger.warn('[useAppStore] Attempted to set non-solo queue entry, ignoring:', entry.queueType);
      // DO NOT set the entry - reject it immediately
      return;
    }
    set({ currentLeagueEntry: entry });
  },

  setError: (error) => {
    set({ error });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

