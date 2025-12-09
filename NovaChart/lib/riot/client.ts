import { Summoner, LeagueEntry } from '@/types';
import { logger } from '@/lib/utils/logger';
import { handleRiotApiError } from '@/lib/utils/errorHandler';

// Riot Games API base URLs
// Platform routing (for summoner-v4, league-v4, etc.)
// All regions use the same base URL structure: https://{region}.api.riotgames.com
// For League of Legends, regions are: jp1, kr, na1, euw1, eun1, etc.
const RIOT_API_BASE_URL = 'https://{region}.api.riotgames.com';

// Regional routing (for account-v1, match-v5, etc.)
// Regional routing values: ASIA, AMERICAS, EUROPE
const RIOT_API_REGIONAL_BASE_URL = 'https://{routing}.api.riotgames.com';

// Map platform regions to regional routing
// Platform regions (jp1, kr, na1, etc.) are used for summoner-v4, league-v4
// Regional routing (asia, americas, europe) is used for account-v1, match-v5
// Example: jp1 -> asia, na1 -> americas, euw1 -> europe
function getRegionalRouting(platformRegion: string): string {
  const asiaRegions = ['jp1', 'kr', 'oc1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];
  const americasRegions = ['na1', 'br1', 'la1', 'la2'];
  const europeRegions = ['euw1', 'eun1', 'tr1', 'ru'];
  
  if (asiaRegions.includes(platformRegion.toLowerCase())) {
    return 'asia';
  } else if (americasRegions.includes(platformRegion.toLowerCase())) {
    return 'americas';
  } else if (europeRegions.includes(platformRegion.toLowerCase())) {
    return 'europe';
  }
  
  // Default to asia for unknown regions
  return 'asia';
}

export interface RiotApiError {
  status: {
    status_code: number;
    message: string;
  };
}

export class RiotApiClient {
  private apiKey: string;
  private region: string;

  constructor(apiKey: string, region: string = 'jp1') {
    this.apiKey = apiKey;
    this.region = region;
  }

  private async fetchRiotApi<T>(url: string, endpointName?: string): Promise<T> {
    logger.debug(`[Riot API] Requesting: ${url}`);
    logger.debug(`[Riot API] Endpoint: ${endpointName || 'unknown'}`);
    logger.debug(`[Riot API] Region: ${this.region}`);
    logger.debug(`[Riot API] API Key prefix: ${this.apiKey.substring(0, 10)}...`);
    
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    logger.debug(`[Riot API] Response status: ${response.status} ${response.statusText}`);
    logger.debug(`[Riot API] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = '';
      let errorDetails: any = null;
      
      // Try to parse error response
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        logger.error(`[Riot API] Error response:`, JSON.stringify(errorData, null, 2));
        
        if (errorData.status) {
          errorMessage = errorData.status.message || response.statusText;
        } else {
          errorMessage = errorData.message || response.statusText;
        }
      } catch (e) {
        const text = await response.text();
        logger.error(`[Riot API] Error response (text):`, text);
        errorMessage = response.statusText;
      }

      // Extract API endpoint from URL for better error messages
      const urlObj = new URL(url);
      const apiPath = urlObj.pathname;
      const endpointInfo = endpointName || apiPath;

      // Create error object with status code
      const error = new Error(`Riot API Error: ${response.status} - ${errorMessage}`);
      (error as any).statusCode = response.status;
      
      // Use error handler to get user-friendly message
      const userFriendlyMessage = handleRiotApiError(error, endpointInfo);
      throw new Error(userFriendlyMessage);
    }

    return response.json();
  }

  private getBaseUrl(): string {
    // Platform routing for summoner-v4, league-v4, etc.
    // For League of Legends: https://{region}.api.riotgames.com
    // Valid regions: jp1, kr, na1, euw1, eun1, br1, la1, la2, oc1, tr1, ru
    return RIOT_API_BASE_URL.replace('{region}', this.region);
  }

  private getRegionalBaseUrl(): string {
    // Regional routing for account-v1, match-v5, etc.
    // Converts platform region (jp1, kr, na1, etc.) to regional routing (asia, americas, europe)
    // Example: jp1 -> asia, na1 -> americas, euw1 -> europe
    // Returns: https://asia.api.riotgames.com, https://americas.api.riotgames.com, or https://europe.api.riotgames.com
    const routing = getRegionalRouting(this.region);
    return RIOT_API_REGIONAL_BASE_URL.replace('{routing}', routing);
  }

  // Note: getSummonerByName and getSummonerById are deprecated.
  // Use getAccountByRiotId and getSummonerByPuuid instead.

  async getSummonerByPuuid(puuid: string): Promise<Summoner> {
    const url = `${this.getBaseUrl()}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const data = await this.fetchRiotApi<{
      id: string;
      accountId: string;
      puuid: string;
      name: string;
      profileIconId: number;
      revisionDate: number;
      summonerLevel: number;
    }>(url, `GET /lol/summoner/v4/summoners/by-puuid/{puuid}`);

    return {
      id: data.id,
      puuid: data.puuid,
      name: data.name,
      profileIconId: data.profileIconId,
      summonerLevel: data.summonerLevel,
      region: this.region,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get summoner information for the authenticated user (requires API key)
   * Uses platform routing: /lol/summoner/v4/summoners/me
   */
  async getSummonerByMe(): Promise<Summoner> {
    const url = `${this.getBaseUrl()}/lol/summoner/v4/summoners/me`;
    const data = await this.fetchRiotApi<{
      id: string;
      accountId: string;
      puuid: string;
      name: string;
      profileIconId: number;
      revisionDate: number;
      summonerLevel: number;
    }>(url, `GET /lol/summoner/v4/summoners/me`);

    return {
      id: data.id,
      puuid: data.puuid,
      name: data.name,
      profileIconId: data.profileIconId,
      summonerLevel: data.summonerLevel,
      region: this.region,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get account information by Riot ID (gameName + tagLine)
   * Uses regional routing (ASIA, AMERICAS, EUROPE)
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<{
    puuid: string;
    gameName: string;
    tagLine: string;
  }> {
    const encodedGameName = encodeURIComponent(gameName);
    const encodedTagLine = encodeURIComponent(tagLine);
    const url = `${this.getRegionalBaseUrl()}/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`;
    const data = await this.fetchRiotApi<{
      puuid: string;
      gameName: string;
      tagLine: string;
    }>(url, `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`);

    return data;
  }

  /**
   * Get account information by PUUID
   * Uses regional routing (ASIA, AMERICAS, EUROPE)
   */
  async getAccountByPuuid(puuid: string): Promise<{
    puuid: string;
    gameName: string;
    tagLine: string;
  }> {
    const url = `${this.getRegionalBaseUrl()}/riot/account/v1/accounts/by-puuid/${puuid}`;
    const data = await this.fetchRiotApi<{
      puuid: string;
      gameName: string;
      tagLine: string;
    }>(url, `GET /riot/account/v1/accounts/by-puuid/{puuid}`);

    return data;
  }

  /**
   * Get league entries by PUUID
   * Uses /lol/league/v4/entries/by-puuid/{encryptedPUUID}
   * Note: encryptedPUUID is the puuid itself (NOT summonerId)
   */
  async getLeagueEntriesByPuuid(puuid: string): Promise<LeagueEntry[]> {
    // Use puuid directly as encryptedPUUID (NOT summonerId)
    const url = `${this.getBaseUrl()}/lol/league/v4/entries/by-puuid/${puuid}`;
    logger.debug('[RiotApiClient] getLeagueEntriesByPuuid - puuid (encryptedPUUID):', puuid);
    logger.debug('[RiotApiClient] getLeagueEntriesByPuuid - API URL:', url);
    const data = await this.fetchRiotApi<LeagueEntry[]>(url, `GET /lol/league/v4/entries/by-puuid/{encryptedPUUID}`);
    logger.debug('[RiotApiClient] getLeagueEntriesByPuuid - League entries count:', data.length);
    logger.debug('[RiotApiClient] getLeagueEntriesByPuuid - League entries:', JSON.stringify(data, null, 2));
    return data;
  }

  async getRankedSoloQueueEntryByPuuid(puuid: string): Promise<LeagueEntry | null> {
    const entries = await this.getLeagueEntriesByPuuid(puuid);
    return entries.find(entry => entry.queueType === 'RANKED_SOLO_5x5') || null;
  }

  async getRankedFlexEntryByPuuid(puuid: string): Promise<LeagueEntry | null> {
    const entries = await this.getLeagueEntriesByPuuid(puuid);
    return entries.find(entry => entry.queueType === 'RANKED_FLEX_SR') || null;
  }

  /**
   * Get match IDs by PUUID
   * Uses /lol/match/v5/matches/by-puuid/{puuid}/ids
   * Returns list of match IDs
   */
  async getMatchIdsByPuuid(puuid: string, start?: number, count: number = 20, queue?: number): Promise<string[]> {
    const regionalUrl = this.getRegionalBaseUrl();
    let url = `${regionalUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
    if (start !== undefined) {
      url += `&start=${start}`;
    }
    if (queue !== undefined) {
      url += `&queue=${queue}`;
    }
    logger.debug('[RiotApiClient] getMatchIdsByPuuid - API URL:', url);
    const data = await this.fetchRiotApi<string[]>(url, `GET /lol/match/v5/matches/by-puuid/{puuid}/ids`);
    logger.debug('[RiotApiClient] getMatchIdsByPuuid - Match IDs count:', data.length);
    return data;
  }

  /**
   * Get match details by match ID
   * Uses /lol/match/v5/matches/{matchId}
   */
  async getMatchByMatchId(matchId: string): Promise<any> {
    const regionalUrl = this.getRegionalBaseUrl();
    const url = `${regionalUrl}/lol/match/v5/matches/${matchId}`;
    logger.debug('[RiotApiClient] getMatchByMatchId - API URL:', url);
    const data = await this.fetchRiotApi<any>(url, `GET /lol/match/v5/matches/{matchId}`);
    return data;
  }

  /**
   * Get all ranked match IDs for a player (up to a limit)
   * Queue ID 420 = Ranked Solo/Duo, 440 = Ranked Flex
   */
  async getAllRankedMatchIds(puuid: string, maxMatches: number = 100): Promise<string[]> {
    const allMatchIds: string[] = [];
    let start = 0;
    const count = 100; // Max per request
    const queueId = 420; // Ranked Solo/Duo

    while (allMatchIds.length < maxMatches) {
      try {
        const matchIds = await this.getMatchIdsByPuuid(puuid, start, count, queueId);
        if (matchIds.length === 0) {
          break;
        }
        allMatchIds.push(...matchIds);
        start += count;
        
        if (matchIds.length < count) {
          break; // No more matches
        }
      } catch (error) {
        logger.error('[RiotApiClient] Error fetching match IDs:', error);
        break;
      }
    }

    logger.debug('[RiotApiClient] getAllRankedMatchIds - Total match IDs:', allMatchIds.length);
    return allMatchIds.slice(0, maxMatches);
  }
}

// Utility function to convert tier and rank to LP value for comparison
export function tierRankToLP(tier: string, rank: string, lp: number): number {
  const tierValues: Record<string, number> = {
    'IRON': 0,
    'BRONZE': 400,
    'SILVER': 800,
    'GOLD': 1200,
    'PLATINUM': 1600,
    'EMERALD': 2000,
    'DIAMOND': 2400,
    'MASTER': 2800,
    'GRANDMASTER': 2800,
    'CHALLENGER': 2800,
  };

  const rankValues: Record<string, number> = {
    'IV': 0,
    'III': 100,
    'II': 200,
    'I': 300,
  };

  const baseLP = tierValues[tier.toUpperCase()] || 0;
  const rankLP = rankValues[rank.toUpperCase()] || 0;
  
  // Master, Grandmaster, Challenger don't have ranks
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier.toUpperCase())) {
    return baseLP + lp;
  }

  return baseLP + rankLP + lp;
}

export function lpToTierRank(totalLP: number): { tier: string; rank: string; lp: number } {
  const tiers = [
    { name: 'IRON', base: 0, max: 400 },
    { name: 'BRONZE', base: 400, max: 800 },
    { name: 'SILVER', base: 800, max: 1200 },
    { name: 'GOLD', base: 1200, max: 1600 },
    { name: 'PLATINUM', base: 1600, max: 2000 },
    { name: 'EMERALD', base: 2000, max: 2400 },
    { name: 'DIAMOND', base: 2400, max: 2800 },
    { name: 'MASTER', base: 2800, max: Infinity },
  ];

  const ranks = ['IV', 'III', 'II', 'I'];

  for (const tier of tiers) {
    if (totalLP < tier.max) {
      if (tier.name === 'MASTER') {
        return { tier: tier.name, rank: '', lp: totalLP - tier.base };
      }
      const lpInTier = totalLP - tier.base;
      const rankIndex = Math.floor(lpInTier / 100);
      const rank = ranks[Math.min(rankIndex, ranks.length - 1)];
      const lp = lpInTier % 100;
      return { tier: tier.name, rank, lp };
    }
  }

  return { tier: 'MASTER', rank: '', lp: totalLP - 2800 };
}

