export interface RateHistory {
  id?: number;
  date: Date;
  tier: string;      // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
  rank: string;      // IV, III, II, I
  lp: number;
  wins: number;
  losses: number;
}

export interface Goal {
  id?: number;
  targetDate: Date;
  targetTier: string;
  targetRank: string;
  targetLP: number;
  createdAt: Date;
  isActive: boolean;
}

export interface Match {
  id?: number;
  date: Date;
  win: boolean;
  role?: string;
  champion?: string;
  kda?: { kills: number; deaths: number; assists: number };
  csAt10?: number;
  visionScore?: number;
  killParticipation?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  memo?: string;
}

export interface Summoner {
  id?: string; // Optional - not required, puuid is the primary identifier
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
  region: string;
  lastUpdated: Date;
}

export interface LeagueEntry {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

