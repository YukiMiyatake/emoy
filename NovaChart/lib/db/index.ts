import Dexie, { Table } from 'dexie';
import { RateHistory, Goal, Match, Summoner, LeagueEntry, SkillGoal } from '@/types';

export class NovaChartDB extends Dexie {
  rateHistory!: Table<RateHistory, string>; // matchId as primary key (string)
  goals!: Table<Goal, number>;
  matches!: Table<Match, string>; // matchId as primary key (string)
  summoners!: Table<Summoner, string>;
  leagueEntries!: Table<LeagueEntry & { puuid: string; lastUpdated: Date }, string>; // puuid as primary key
  skillGoals!: Table<SkillGoal, number>;

  constructor() {
    // Use a new database name to avoid primary key migration issues
    // This will create a fresh database with the correct schema
    // Changed to v4 to avoid version conflicts with existing databases (matches table now uses matchId as key)
    super('NovaChartDB_v4');
    
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

    // Version 4: Change rateHistory primary key from id (number) to matchId (string)
    // This deletes and recreates the rateHistory table with the new schema
    this.version(4).stores({
      rateHistory: '&matchId, date, tier, rank, lp', // &matchId = unique primary key (string)
      goals: '++id, targetDate, createdAt, isActive',
      matches: '++id, date, win, role, champion',
      summoners: '&puuid, id, name, region, lastUpdated',
      leagueEntries: '&puuid, queueType, lastUpdated',
      skillGoals: '++id, type, lane, createdAt, isActive',
    }).upgrade(async (tx) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:56',message:'Version 4 migration started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Clear rateHistory table - old data with id key will be lost
      // This is intentional as we're changing the primary key type
      await tx.table('rateHistory').clear();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:60',message:'Version 4 migration completed - rateHistory cleared',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    });

    // Version 5: Change matches primary key from id (number) to matchId (string)
    // This deletes and recreates the matches table with the new schema
    this.version(5).stores({
      rateHistory: '&matchId, date, tier, rank, lp',
      goals: '++id, targetDate, createdAt, isActive',
      matches: '&matchId, date, win, role, champion', // &matchId = unique primary key (string)
      summoners: '&puuid, id, name, region, lastUpdated',
      leagueEntries: '&puuid, queueType, lastUpdated',
      skillGoals: '++id, type, lane, createdAt, isActive',
    }).upgrade(async (tx) => {
      // Clear matches table - old data with id key will be lost
      // This is intentional as we're changing the primary key type
      await tx.table('matches').clear();
    });
  }
}

// #region agent log
fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:68',message:'Initializing NovaChartDB',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
// #endregion

// Delete old databases to avoid version conflicts
if (typeof window !== 'undefined' && 'indexedDB' in window) {
  // Delete old database versions that might cause conflicts
  const oldDbNames = ['NovaChartDB', 'NovaChartDB_v2', 'NovaChartDB_v3'];
  oldDbNames.forEach(async (dbName) => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:73',message:'Attempting to delete old database',data:{dbName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      const deleteReq = indexedDB.deleteDatabase(dbName);
      deleteReq.onsuccess = () => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:77',message:'Old database deleted',data:{dbName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        console.log(`[NovaChartDB] Deleted old database: ${dbName}`);
      };
      deleteReq.onerror = () => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:81',message:'Failed to delete old database',data:{dbName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        console.warn(`[NovaChartDB] Failed to delete old database: ${dbName}`);
      };
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:85',message:'Error deleting old database',data:{dbName,error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      console.warn(`[NovaChartDB] Error deleting old database ${dbName}:`, error);
    }
  });
}

export const db = new NovaChartDB();
// #region agent log
fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:92',message:'NovaChartDB initialized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
// #endregion

// Helper functions for data operations
export const rateHistoryService = {
  async getAll(): Promise<RateHistory[]> {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:64',message:'getAll called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      const result = await db.rateHistory.orderBy('date').toArray();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:68',message:'getAll result',data:{count:result.length,firstEntry:result[0]?{matchId:result[0].matchId,hasId:!!(result[0] as any).id}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Filter out any entries without matchId (should not happen, but safety check)
      const valid = result.filter(r => r.matchId);
      if (valid.length !== result.length) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:72',message:'Filtered invalid entries',data:{original:result.length,filtered:valid.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
      return valid;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:76',message:'getAll error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<RateHistory[]> {
    return await db.rateHistory
      .where('date')
      .between(startDate, endDate, true, true)
      .sortBy('date');
  },

  async getByMatchId(matchId: string): Promise<RateHistory | undefined> {
    return await db.rateHistory.get(matchId);
  },

  async getAllMatchIds(): Promise<string[]> {
    const all = await db.rateHistory.toArray();
    return all.map(r => r.matchId);
  },

  async add(rate: RateHistory): Promise<string> {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:95',message:'add called',data:{matchId:rate.matchId,date:rate.date,tier:rate.tier},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Validate matchId
    if (!rate.matchId || typeof rate.matchId !== 'string') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:99',message:'Invalid matchId',data:{matchId:rate.matchId,type:typeof rate.matchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw new Error(`Invalid matchId: ${rate.matchId}`);
    }
    // Check for duplicate by matchId
    const existing = await db.rateHistory.get(rate.matchId);

    if (existing) {
      // Update existing entry instead of adding duplicate
      console.log('[RateHistoryService] Duplicate entry found for matchId:', rate.matchId, 'Updating existing entry');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:108',message:'Updating existing entry',data:{matchId:rate.matchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      await db.rateHistory.update(rate.matchId, {
        date: rate.date,
        tier: rate.tier,
        rank: rate.rank,
        lp: rate.lp,
        wins: rate.wins,
        losses: rate.losses,
      });
      return rate.matchId;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:121',message:'Adding new entry',data:{matchId:rate.matchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      const result = await db.rateHistory.add(rate);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:125',message:'Entry added successfully',data:{matchId:result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d330803d-3a0f-4516-8960-6b4804e42617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/index.ts:129',message:'Add error',data:{error:error instanceof Error?error.message:String(error),matchId:rate.matchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  },

  async update(matchId: string, changes: Partial<Omit<RateHistory, 'matchId'>>): Promise<number> {
    return await db.rateHistory.update(matchId, changes);
  },

  async delete(matchId: string): Promise<void> {
    return await db.rateHistory.delete(matchId);
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

  async getByMatchId(matchId: string): Promise<Match | undefined> {
    return await db.matches.get(matchId);
  },

  async getAllMatchIds(): Promise<string[]> {
    const all = await db.matches.toArray();
    return all.map(m => m.matchId);
  },

  async add(match: Match): Promise<string> {
    // Check for duplicate by matchId
    const existing = await db.matches.get(match.matchId);

    if (existing) {
      // Update existing entry instead of adding duplicate
      console.log('[MatchService] Duplicate entry found for matchId:', match.matchId, 'Updating existing entry');
      await db.matches.update(match.matchId, match);
      return match.matchId;
    }

    return await db.matches.add(match);
  },

  async update(matchId: string, changes: Partial<Omit<Match, 'matchId'>>): Promise<number> {
    return await db.matches.update(matchId, changes);
  },

  async delete(matchId: string): Promise<void> {
    return await db.matches.delete(matchId);
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

