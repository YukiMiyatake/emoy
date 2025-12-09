import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Summoner, LeagueEntry } from '@/types';
import { API_ENDPOINTS, DEFAULTS } from '@/lib/constants';
import { extractLeagueEntry } from '@/lib/utils/leagueEntry';
import { StorageService } from '@/lib/utils/storage';
import { getDateKey } from '@/lib/utils/date';
import { logger } from '@/lib/utils/logger';
import { handleRiotApiError } from '@/lib/utils/errorHandler';

interface UseSummonerSearchReturn {
  isSearching: boolean;
  search: (riotId: string, region: string) => Promise<void>;
}

export function useSummonerSearch(
  onSuccess?: () => void
): UseSummonerSearchReturn {
  const { setCurrentSummoner, setCurrentLeagueEntry, setLoading, setError } = useAppStore();
  const [isSearching, setIsSearching] = useState(false);

  const fetchAndSaveRateHistory = useCallback(async (puuid: string, region: string, apiKey: string | null) => {
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
        return;
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

      // ⚠️ CRITICAL: Update current league entry if not already set
      // Note: fetch-rate-history API already returns only solo queue data,
      // but we explicitly set queueType to DEFAULTS.QUEUE_TYPE (RANKED_SOLO_5x5) for safety.
      // setCurrentLeagueEntry will also validate that it's solo queue.
      const currentState = useAppStore.getState();
      if (result.currentEntry && !currentState.currentLeagueEntry) {
        setCurrentLeagueEntry({
          leagueId: '',
          queueType: DEFAULTS.QUEUE_TYPE, // Explicitly set to RANKED_SOLO_5x5
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
    }
  }, [setCurrentLeagueEntry]);

  const search = useCallback(async (riotId: string, region: string) => {
    // Parse Riot ID (gameName#tagLine)
    const parts = riotId.split('#');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      const errorMsg = 'Riot IDを「ゲーム名#タグライン」の形式で入力してください（例: PlayerName#JP1）';
      logger.error('[SummonerSearch] Validation error:', errorMsg);
      throw new Error(errorMsg);
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
        throw new Error(errorMsg);
      }
      
      const url = `${API_ENDPOINTS.RIOT.ACCOUNT_BY_RIOT_ID}?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${currentRegion}&apiKey=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        logger.debug('[SummonerSearch] Response data:', data);
        
        // Check if data has summoner property or is the summoner itself
        const summonerData = data?.summoner || data;
        logger.debug('[SummonerSearch] Summoner data:', summonerData);
        
        if (!summonerData) {
          logger.error('[SummonerSearch] Summoner data is null or undefined');
          logger.error('[SummonerSearch] Full response data:', JSON.stringify(data, null, 2));
          throw new Error('サマナー情報が不正です。レスポンスにサマナー情報が含まれていません。');
        }
        
        // Check if puuid exists (required)
        if (!summonerData.puuid) {
          logger.error('[SummonerSearch] Invalid summoner data - missing puuid');
          logger.error('[SummonerSearch] Summoner data:', JSON.stringify(summonerData, null, 2));
          throw new Error('サマナー情報が不正です。puuidが存在しません。');
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
        
        // ⚠️ CRITICAL: Fetch league entry to display current rank (solo queue only)
        // This mistake has been made multiple times. DO NOT forget to:
        // 1. Specify queueType=RANKED_SOLO_5x5 in the API call
        // 2. Check that the returned entry is solo queue before setting it
        try {
          // ⚠️ MUST specify queueType parameter explicitly - DO NOT rely on defaults
          const leagueResponse = await fetch(`${API_ENDPOINTS.RIOT.LEAGUE_BY_PUUID}?puuid=${encodeURIComponent(summoner.puuid)}&region=${currentRegion}&queueType=${DEFAULTS.QUEUE_TYPE}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`);
          if (leagueResponse.ok) {
            const leagueData = await leagueResponse.json();
            if (leagueData.entry) {
              const entry = extractLeagueEntry(leagueData.entry);
              // ⚠️ CRITICAL: Only set if it's solo queue (RANKED_SOLO_5x5)
              // This check has been missing multiple times. DO NOT REMOVE THIS CHECK.
              // DO NOT set flex queue or any other queue type entry.
              if (entry.queueType === 'RANKED_SOLO_5x5') {
                setCurrentLeagueEntry(entry);
              } else {
                logger.warn('[SummonerSearch] Received non-solo queue entry, ignoring:', entry.queueType);
                // DO NOT set the entry - reject it
              }
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
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
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
      throw error; // Re-throw to let component handle it
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, [setCurrentSummoner, setCurrentLeagueEntry, setLoading, setError, fetchAndSaveRateHistory, onSuccess]);

  return { isSearching, search };
}

