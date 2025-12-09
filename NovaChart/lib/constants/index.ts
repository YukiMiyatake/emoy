/**
 * Application constants
 * Centralized constants for storage keys, API endpoints, and default values
 */

// Storage keys
export const STORAGE_KEYS = {
  API_KEY: 'riot_api_key',
  API_REGION: 'riot_api_region',
  RIOT_ID: 'riot_id',
  GAME_NAME: 'riot_game_name', // For backward compatibility
  TAG_LINE: 'riot_tag_line', // For backward compatibility
} as const;

// API endpoints
export const API_ENDPOINTS = {
  RIOT: {
    ACCOUNT_BY_RIOT_ID: '/api/riot/account/by-riot-id',
    ACCOUNT_ME: '/api/riot/account/me',
    SUMMONER: '/api/riot/summoner',
    SUMMONER_BY_PUUID: '/api/riot/summoner-by-puuid',
    LEAGUE_BY_PUUID: '/api/riot/league-by-puuid',
    FETCH_RATE_HISTORY: '/api/riot/fetch-rate-history',
    UPDATE: '/api/riot/update',
  },
} as const;

// Default values
export const DEFAULTS = {
  REGION: 'jp1',
  QUEUE_TYPE: 'RANKED_SOLO_5x5',
} as const;

// Queue types
export const QUEUE_TYPES = {
  RANKED_SOLO_5x5: 'RANKED_SOLO_5x5',
  RANKED_FLEX_SR: 'RANKED_FLEX_SR',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  API_KEY_NOT_CONFIGURED: 'Riot API key is not configured. Please set API key in the app settings or .env.local file.',
  PUUID_REQUIRED: 'PUUID is required',
  GAME_NAME_TAG_LINE_REQUIRED: 'Game name and tag line are required. Use Riot ID format (gameName#tagLine)',
  NO_LEAGUE_ENTRY_FOUND: 'No league entry found',
  FAILED_TO_FETCH_SUMMONER: 'Failed to fetch summoner data',
  FAILED_TO_FETCH_LEAGUE: 'Failed to fetch league data',
  FAILED_TO_FETCH_ACCOUNT: 'Failed to fetch account data',
} as const;

