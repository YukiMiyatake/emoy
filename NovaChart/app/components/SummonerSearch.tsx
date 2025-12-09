'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Summoner, LeagueEntry } from '@/types';
import { STORAGE_KEYS, API_ENDPOINTS, DEFAULTS } from '@/lib/constants';
import { extractLeagueEntry } from '@/lib/utils/leagueEntry';
import { StorageService } from '@/lib/utils/storage';
import { getDateKey } from '@/lib/utils/date';
import { logger } from '@/lib/utils/logger';
import { handleRiotApiError } from '@/lib/utils/errorHandler';

interface SummonerSearchProps {
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
  onSearchSuccess?: () => void;
}

export default function SummonerSearch({ 
  isExpanded: isExpandedProp, 
  setIsExpanded: setIsExpandedProp,
  onSearchSuccess 
}: SummonerSearchProps = {}) {
  const { setCurrentSummoner, setCurrentLeagueEntry, setLoading, setError } = useAppStore();
  const [riotId, setRiotId] = useState('');
  const [region, setRegion] = useState(DEFAULTS.REGION);
  const [isSearching, setIsSearching] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(true);
  
  // Use prop if provided, otherwise use internal state
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : internalExpanded;
  const setIsExpanded = setIsExpandedProp || setInternalExpanded;

  useEffect(() => {
    // Load saved values from localStorage
    const savedRegion = StorageService.getApiRegion();
    const savedRiotId = StorageService.getRiotId();
    
    if (savedRegion) {
      setRegion(savedRegion);
    }
    
    if (savedRiotId) {
      setRiotId(savedRiotId);
    } else {
      // For backward compatibility, try to migrate from old format
      const migratedRiotId = StorageService.migrateOldFormat();
      if (migratedRiotId) {
        setRiotId(migratedRiotId);
      }
    }
  }, []);

  // Save riotId to localStorage when it changes
  useEffect(() => {
    if (riotId.trim()) {
      StorageService.setRiotId(riotId);
    }
  }, [riotId]);

  useEffect(() => {
    if (region) {
      StorageService.setApiRegion(region);
    }
  }, [region]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse Riot ID (gameName#tagLine)
    const parts = riotId.split('#');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      const errorMsg = 'Riot IDを「ゲーム名#タグライン」の形式で入力してください（例: PlayerName#JP1）';
      logger.error('[SummonerSearch] Validation error:', errorMsg);
      alert(errorMsg);
      return;
    }
    
    const gameName = parts[0].trim();
    const tagLine = parts[1].trim();

    setIsSearching(true);
    setLoading(true);
    setError(null);

    try {
      // Get API key from localStorage
      const apiKey = StorageService.getApiKey();
      const currentRegion = StorageService.getApiRegion() || region;
      
      if (!apiKey) {
        const errorMsg = 'APIキーが必要です。右上の「APIキー設定」からAPIキーを設定してください。';
        logger.error('[SummonerSearch] API key required:', errorMsg);
        alert(errorMsg);
        setIsSearching(false);
        setLoading(false);
        return;
      }
      
      const url = `${API_ENDPOINTS.RIOT.ACCOUNT_BY_RIOT_ID}?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${currentRegion}&apiKey=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url);
      
      if (response.ok) {
          const data = await response.json();
          logger.debug('[SummonerSearch] Response data:', data);
          logger.debug('[SummonerSearch] Response data type:', typeof data);
          logger.debug('[SummonerSearch] Response data keys:', data ? Object.keys(data) : 'data is null/undefined');
          logger.debug('[SummonerSearch] data.summoner:', data?.summoner);
          logger.debug('[SummonerSearch] data.account:', data?.account);
          
          // Check if data has summoner property or is the summoner itself
          const summonerData = data?.summoner || data;
          logger.debug('[SummonerSearch] Summoner data:', summonerData);
          logger.debug('[SummonerSearch] Summoner data type:', typeof summonerData);
          logger.debug('[SummonerSearch] Summoner data keys:', summonerData ? Object.keys(summonerData) : 'summonerData is null/undefined');
          logger.debug('[SummonerSearch] Summoner id:', summonerData?.id);
          logger.debug('[SummonerSearch] Summoner id type:', typeof summonerData?.id);
          logger.debug('[SummonerSearch] Summoner puuid:', summonerData?.puuid);
          logger.debug('[SummonerSearch] Summoner puuid type:', typeof summonerData?.puuid);
          
          if (!summonerData) {
            logger.error('[SummonerSearch] Summoner data is null or undefined');
            logger.error('[SummonerSearch] Full response data:', JSON.stringify(data, null, 2));
            const errorMsg = 'サマナー情報が不正です。レスポンスにサマナー情報が含まれていません。';
            logger.error('[SummonerSearch] Error:', errorMsg);
            throw new Error(errorMsg);
          }
          
          // Check if puuid exists (required)
          if (!summonerData.puuid) {
            logger.error('[SummonerSearch] Invalid summoner data - missing puuid');
            logger.error('[SummonerSearch] Summoner data:', JSON.stringify(summonerData, null, 2));
            logger.error('[SummonerSearch] Full response data:', JSON.stringify(data, null, 2));
            const errorMsg = `サマナー情報が不正です。puuidが存在しません。`;
            logger.error('[SummonerSearch] Error:', errorMsg);
            throw new Error(errorMsg);
          }
          
          // If name is missing, fetch from summoner API using puuid
          if (!summonerData.name) {
            logger.warn('[SummonerSearch] Summoner name is missing, fetching from API...');
            try {
              const { RiotApiClient } = await import('@/lib/riot/client');
              const apiKey = StorageService.getApiKey();
              const currentRegion = StorageService.getApiRegion() || region;
              if (apiKey) {
                const client = new RiotApiClient(apiKey, currentRegion);
                const fullSummonerData = await client.getSummonerByPuuid(summonerData.puuid);
                logger.debug('[SummonerSearch] Fetched full summoner data:', fullSummonerData);
                // Merge missing fields into summonerData
                if (fullSummonerData.name) {
                  summonerData.name = fullSummonerData.name;
                }
                if (fullSummonerData.profileIconId) {
                  summonerData.profileIconId = fullSummonerData.profileIconId;
                }
                if (fullSummonerData.summonerLevel) {
                  summonerData.summonerLevel = fullSummonerData.summonerLevel;
                }
                if (fullSummonerData.id) {
                  summonerData.id = fullSummonerData.id;
                }
                logger.debug('[SummonerSearch] Updated summonerData:', summonerData);
              }
            } catch (error) {
              logger.warn('[SummonerSearch] Error fetching summoner name:', error);
            }
          }
          
          // Convert lastUpdated from string to Date if needed
          const summoner: Summoner = {
            ...summonerData,
            lastUpdated: summonerData.lastUpdated instanceof Date 
              ? summonerData.lastUpdated 
              : new Date(summonerData.lastUpdated),
          };
          
          logger.debug('[SummonerSearch] Processed summoner:', summoner);
          
          setCurrentSummoner(summoner);
          
          // Fetch league entry to display current rank
          try {
            const leagueResponse = await fetch(`${API_ENDPOINTS.RIOT.LEAGUE_BY_PUUID}?puuid=${encodeURIComponent(summoner.puuid)}&region=${currentRegion}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`);
            if (leagueResponse.ok) {
              const leagueData = await leagueResponse.json();
              if (leagueData.entry) {
                // Extract only LeagueEntry fields to avoid including extra fields
                const entry = extractLeagueEntry(leagueData.entry);
                setCurrentLeagueEntry(entry);
              }
            }
          } catch (error) {
            logger.error('[SummonerSearch] Failed to fetch league entry:', error);
            // Don't throw - we can still use the summoner even if league fetch fails
          }
          
          // Save to database on client-side
          try {
            const { summonerService } = await import('@/lib/db');
            await summonerService.addOrUpdate(summoner);
            logger.debug('[SummonerSearch] Summoner saved to database successfully');
          } catch (error) {
            logger.error('[SummonerSearch] Failed to save summoner to database:', error);
            // Don't throw - we can still use the summoner even if save fails
          }
          
          // Automatically fetch rate history from match history
          await fetchAndSaveRateHistory(summoner.puuid, currentRegion, apiKey);
          
          // Close the search form after successful search
          setIsExpanded(false);
          if (onSearchSuccess) {
            onSearchSuccess();
          }
          
          setIsSearching(false);
          setLoading(false);
          return;
        } else {
          // Handle error response
          const errorData = await response.json();
          const errorMessage = errorData.error || 'サマナーが見つかりませんでした';
          
          // Create error object with status code for error handler
          const error = new Error(errorMessage);
          (error as any).statusCode = response.status;
          
          // Use error handler to get user-friendly message
          throw new Error(handleRiotApiError(error, API_ENDPOINTS.RIOT.ACCOUNT_BY_RIOT_ID));
        }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '検索に失敗しました';
      logger.error('[SummonerSearch] Search error:', error);
      logger.error('[SummonerSearch] Error message:', errorMessage);
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  // Helper function to fetch and save rate history from match history
  const fetchAndSaveRateHistory = async (puuid: string, region: string, apiKey: string | null) => {
    try {
      if (!apiKey) {
        logger.warn('[SummonerSearch] API key not available for rate history fetch');
        return;
      }

      logger.debug('[SummonerSearch] Automatically fetching rate history from match history...');
      const response = await fetch(API_ENDPOINTS.RIOT.FETCH_RATE_HISTORY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puuid,
          region,
          apiKey,
          maxMatches: 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || 'レート履歴の取得に失敗しました';
        logger.warn('[SummonerSearch] Failed to fetch rate history:', errorMessage);
        return; // Don't throw - just log and continue
      }

      const result = await response.json();
      logger.debug('[SummonerSearch] Rate history fetched:', result);
      logger.debug('[SummonerSearch] Rate history entries:', result.rateHistory?.length || 0);

      // Save rate history to database
      if (result.rateHistory && result.rateHistory.length > 0) {
        const { addRateHistory, rateHistory: currentRateHistory } = useAppStore.getState();
        let addedCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        
        // Create a map of existing entries by date (same day) for comparison
        const existingByDate = new Map<string, number>();
        currentRateHistory.forEach(entry => {
          const entryDate = new Date(entry.date);
          const dateKey = getDateKey(entryDate);
          existingByDate.set(dateKey, (existingByDate.get(dateKey) || 0) + 1);
        });
        
        for (const entry of result.rateHistory) {
          try {
            const entryDate = new Date(entry.date);
            const dateKey = getDateKey(entryDate);
            const existedBefore = existingByDate.has(dateKey);
            
            await addRateHistory({
              date: entryDate,
              tier: entry.tier,
              rank: entry.rank,
              lp: entry.lp,
              wins: entry.wins,
              losses: entry.losses,
            });
            
            // Reload state to get accurate count
            await useAppStore.getState().loadRateHistory();
            
            // Check if entry was added or updated based on whether it existed before
            if (existedBefore) {
              updatedCount++;
            } else {
              addedCount++;
              existingByDate.set(dateKey, 1);
            }
          } catch (error) {
            failedCount++;
            logger.error('[SummonerSearch] Error saving rate history entry:', error);
          }
        }
        
        logger.info(`[SummonerSearch] Rate history saved: ${addedCount} added, ${updatedCount} updated, ${failedCount} failed`);
      }

      // Update current league entry if not already set
      const currentState = useAppStore.getState();
      if (result.currentEntry && !currentState.currentLeagueEntry) {
        setCurrentLeagueEntry({
          leagueId: '',
          queueType: DEFAULTS.QUEUE_TYPE,
          tier: result.currentEntry.tier,
          rank: result.currentEntry.rank,
          leaguePoints: result.currentEntry.lp,
          wins: result.currentEntry.wins,
          losses: result.currentEntry.losses,
          veteran: false,
          inactive: false,
          freshBlood: false,
          hotStreak: false,
        });
      }

      logger.info(`[SummonerSearch] Rate history fetched and saved: ${result.rateHistory?.length || 0} entries`);
    } catch (error) {
      logger.warn('[SummonerSearch] Error fetching rate history, but continuing:', error);
      // Don't throw - we can still use the summoner even if rate history fetch fails
    }
  };


  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${isExpanded ? 'p-4' : 'p-2'}`}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>サマナー検索</span>
        </button>
      </div>
      
      {isExpanded && (
        <form onSubmit={handleSearch} className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Riot ID</label>
            <input
              type="text"
              value={riotId}
              onChange={(e) => setRiotId(e.target.value)}
              placeholder="ゲーム名#タグライン（例: PlayerName#JP1）"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">リージョン</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="jp1">JP</option>
              <option value="kr">KR</option>
              <option value="na1">NA</option>
              <option value="euw1">EUW</option>
              <option value="eun1">EUN</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSearching ? '検索中...' : '検索'}
        </button>
      </form>
      )}
    </div>
  );
}

