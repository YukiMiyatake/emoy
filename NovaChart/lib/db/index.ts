import Dexie, { Table } from 'dexie';
import { RateHistory, Goal, Match, Summoner, LeagueEntry, SkillGoal } from '@/types';

export class NovaChartDB extends Dexie {
  rateHistory!: Table<RateHistory, number>;
  goals!: Table<Goal, number>;
  matches!: Table<Match, number>;
  summoners!: Table<Summoner, string>;
  leagueEntries!: Table<LeagueEntry & { puuid: string; lastUpdated: Date }, string>; // puuid as primary key
  skillGoals!: Table<SkillGoal, number>;

  constructor() {
    // Use a new database name to avoid primary key migration issues
    // This will create a fresh database with the correct schema
    super('NovaChartDB_v2');
    
    // Start directly with the correct schema (puuid as primary key)
    // If users have old data, they will need to re-add their summoners
    this.version(1).stores({
      rateHistory: '++id, date, tier, rank, lp',
      goals: '++id, targetDate, createdAt, isActive',
      matches: '++id, date, win, role, champion',
      summoners: '&puuid, id, name, region, lastUpdated', // &puuid = unique primary key
    });
    
    // Version 2: Add leagueEntries table
    this.version(2).stores({
      rateHistory: '++id, date, tier, rank, lp',
      goals: '++id, targetDate, createdAt, isActive',
      matches: '++id, date, win, role, champion',
      summoners: '&puuid, id, name, region, lastUpdated',
      leagueEntries: '&puuid, queueType, lastUpdated', // &puuid = unique primary key, only solo queue entries
    });

    // Version 3: Add skillGoals table
    this.version(3).stores({
      rateHistory: '++id, date, tier, rank, lp',
      goals: '++id, targetDate, createdAt, isActive',
      matches: '++id, date, win, role, champion',
      summoners: '&puuid, id, name, region, lastUpdated',
      leagueEntries: '&puuid, queueType, lastUpdated',
      skillGoals: '++id, type, lane, createdAt, isActive',
    });
  }
}

export const db = new NovaChartDB();

// Helper functions for data operations
export const rateHistoryService = {
  async getAll(): Promise<RateHistory[]> {
    return await db.rateHistory.orderBy('date').toArray();
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<RateHistory[]> {
    return await db.rateHistory
      .where('date')
      .between(startDate, endDate, true, true)
      .sortBy('date');
  },

  async add(rate: Omit<RateHistory, 'id'>): Promise<number> {
    // Check for duplicate by date (same day)
    const rateDate = new Date(rate.date);
    const startOfDay = new Date(rateDate.getFullYear(), rateDate.getMonth(), rateDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existing = await db.rateHistory
      .where('date')
      .between(startOfDay, endOfDay, true, false)
      .first();

    if (existing) {
      // Update existing entry instead of adding duplicate
      console.log('[RateHistoryService] Duplicate entry found for date:', rateDate.toISOString(), 'Updating existing entry');
      await db.rateHistory.update(existing.id!, {
        date: rate.date, // Update date to reflect the latest capture time
        tier: rate.tier,
        rank: rate.rank,
        lp: rate.lp,
        wins: rate.wins,
        losses: rate.losses,
      });
      return existing.id!;
    }

    return await db.rateHistory.add(rate as RateHistory);
  },

  async update(id: number, changes: Partial<RateHistory>): Promise<number> {
    return await db.rateHistory.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return await db.rateHistory.delete(id);
  },

  async deleteAll(): Promise<void> {
    return await db.rateHistory.clear();
  },

  async getLatest(): Promise<RateHistory | undefined> {
    return await db.rateHistory.orderBy('date').last();
  },
};

export const goalService = {
  async getAll(): Promise<Goal[]> {
    return await db.goals.orderBy('targetDate').toArray();
  },

  async getActive(): Promise<Goal | undefined> {
    return await db.goals.where('isActive').equals(1).first();
  },

  async add(goal: Omit<Goal, 'id'>): Promise<number> {
    // Allow multiple active goals - don't deactivate existing goals
    return await db.goals.add(goal as Goal);
  },

  async update(id: number, changes: Partial<Goal>): Promise<number> {
    return await db.goals.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return await db.goals.delete(id);
  },

  async deleteAll(): Promise<void> {
    return await db.goals.clear();
  },
};

export const matchService = {
  async getAll(): Promise<Match[]> {
    return await db.matches.orderBy('date').reverse().toArray();
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Match[]> {
    return await db.matches
      .where('date')
      .between(startDate, endDate, true, true)
      .sortBy('date');
  },

  async add(match: Omit<Match, 'id'>): Promise<number> {
    return await db.matches.add(match as Match);
  },

  async update(id: number, changes: Partial<Match>): Promise<number> {
    return await db.matches.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return await db.matches.delete(id);
  },

  async deleteAll(): Promise<void> {
    return await db.matches.clear();
  },

  async getWinRate(role?: string, champion?: string): Promise<number> {
    let query = db.matches.toCollection();
    if (role) {
      query = query.filter(m => m.role === role);
    }
    if (champion) {
      query = query.filter(m => m.champion === champion);
    }
    const matches = await query.toArray();
    if (matches.length === 0) return 0;
    const wins = matches.filter(m => m.win).length;
    return (wins / matches.length) * 100;
  },
};

export const summonerService = {
  async getByPuuid(puuid: string): Promise<Summoner | undefined> {
    return await db.summoners.get(puuid);
  },

  async getAll(): Promise<Summoner[]> {
    return await db.summoners.toArray();
  },

  async addOrUpdate(summoner: Summoner): Promise<string> {
    // puuid is required and used as primary key
    if (!summoner.puuid || summoner.puuid.trim() === '') {
      throw new Error('Summoner puuid is required');
    }
    return await db.summoners.put(summoner);
  },

  async delete(puuid: string): Promise<void> {
    return await db.summoners.delete(puuid);
  },

  async deleteAll(): Promise<void> {
    return await db.summoners.clear();
  },
};

// ⚠️ CRITICAL: League entry service - ONLY stores RANKED_SOLO_5x5 (solo queue) entries
// This mistake has been made multiple times. DO NOT store any other queue types.
export const leagueEntryService = {
  /**
   * Get league entry by PUUID (solo queue only)
   * ⚠️ CRITICAL: Only returns solo queue entries. Non-solo queue entries are rejected.
   */
  async getByPuuid(puuid: string): Promise<(LeagueEntry & { puuid: string; lastUpdated: Date }) | undefined> {
    const entry = await db.leagueEntries.get(puuid);
    // Double-check it's solo queue (safety check)
    if (entry && entry.queueType !== 'RANKED_SOLO_5x5') {
      console.warn('[LeagueEntryService] Found non-solo queue entry in database, deleting:', entry.queueType);
      await db.leagueEntries.delete(puuid);
      return undefined;
    }
    return entry;
  },

  /**
   * Add or update league entry (solo queue only)
   * ⚠️ CRITICAL: Only accepts RANKED_SOLO_5x5 entries. Rejects all other queue types.
   */
  async addOrUpdate(puuid: string, entry: LeagueEntry): Promise<string> {
    // ⚠️ CRITICAL: Only allow solo queue entries
    if (entry.queueType !== 'RANKED_SOLO_5x5') {
      throw new Error(`Cannot save non-solo queue entry. Queue type: ${entry.queueType}. Only RANKED_SOLO_5x5 is allowed.`);
    }
    
    if (!puuid || puuid.trim() === '') {
      throw new Error('PUUID is required');
    }
    
    return await db.leagueEntries.put({
      ...entry,
      puuid,
      lastUpdated: new Date(),
    });
  },

  /**
   * Delete league entry by PUUID
   */
  async delete(puuid: string): Promise<void> {
    return await db.leagueEntries.delete(puuid);
  },

  /**
   * Delete all league entries
   */
  async deleteAll(): Promise<void> {
    return await db.leagueEntries.clear();
  },
};

export const skillGoalService = {
  async getAll(): Promise<SkillGoal[]> {
    return await db.skillGoals.orderBy('createdAt').reverse().toArray();
  },

  async getActive(): Promise<SkillGoal[]> {
    return await db.skillGoals.where('isActive').equals(1).toArray();
  },

  async getByType(type: SkillGoal['type']): Promise<SkillGoal[]> {
    return await db.skillGoals.where('type').equals(type).toArray();
  },

  async add(goal: Omit<SkillGoal, 'id'>): Promise<number> {
    return await db.skillGoals.add(goal as SkillGoal);
  },

  async update(id: number, changes: Partial<SkillGoal>): Promise<number> {
    return await db.skillGoals.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return await db.skillGoals.delete(id);
  },

  async deleteAll(): Promise<void> {
    return await db.skillGoals.clear();
  },
};

export async function clearAllData(): Promise<void> {
  await rateHistoryService.deleteAll();
  await goalService.deleteAll();
  await matchService.deleteAll();
  await summonerService.deleteAll();
  await leagueEntryService.deleteAll();
  await skillGoalService.deleteAll();
}

