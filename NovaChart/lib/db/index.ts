import Dexie, { Table } from 'dexie';
import { RateHistory, Goal, Match, Summoner } from '@/types';

export class NovaChartDB extends Dexie {
  rateHistory!: Table<RateHistory, number>;
  goals!: Table<Goal, number>;
  matches!: Table<Match, number>;
  summoners!: Table<Summoner, string>;

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
    return await db.rateHistory.add(rate as RateHistory);
  },

  async update(id: number, changes: Partial<RateHistory>): Promise<number> {
    return await db.rateHistory.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return await db.rateHistory.delete(id);
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
    return await db.goals.where('isActive').equals(true).first();
  },

  async add(goal: Omit<Goal, 'id'>): Promise<number> {
    // Deactivate all existing goals
    await db.goals.where('isActive').equals(true).modify({ isActive: false });
    return await db.goals.add(goal as Goal);
  },

  async update(id: number, changes: Partial<Goal>): Promise<number> {
    return await db.goals.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return await db.goals.delete(id);
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
};

