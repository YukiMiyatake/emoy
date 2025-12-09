'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import SummonerSearch from './components/SummonerSearch';
import RateChart from './components/RateChart';
import GoalSetting from './components/GoalSetting';
import StatsPanel from './components/StatsPanel';
import ApiKeySettings from './components/ApiKeySettings';
import { Summoner, LeagueEntry } from '@/types';
import { STORAGE_KEYS, API_ENDPOINTS, DEFAULTS } from '@/lib/constants';
import { extractLeagueEntry } from '@/lib/utils/leagueEntry';
import { StorageService } from '@/lib/utils/storage';
import { logger } from '@/lib/utils/logger';

export default function Home() {
  const { loadRateHistory, loadGoals, loadMatches, currentSummoner, currentLeagueEntry, setCurrentSummoner, setCurrentLeagueEntry, setLoading, setError, addRateHistory } = useAppStore();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isApiKeyExpanded, setIsApiKeyExpanded] = useState(false);
  const [riotId, setRiotId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Load initial data
    loadRateHistory();
    loadGoals();
    loadMatches();
    
    // Load saved summoner from database
    const loadSavedSummoner = async () => {
      try {
        const { summonerService } = await import('@/lib/db');
        const summoners = await summonerService.getAll();
        if (summoners.length > 0) {
          // Get the most recently updated summoner
          const latestSummoner = summoners.sort((a, b) => 
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
          )[0];
          setCurrentSummoner(latestSummoner);
        }
      } catch (error) {
        logger.error('[Home] Failed to load saved summoner:', error);
      }
    };
    
    loadSavedSummoner();
  }, [loadRateHistory, loadGoals, loadMatches, setCurrentSummoner]);

  useEffect(() => {
    // Load Riot ID from localStorage
    const savedRiotId = StorageService.getRiotId();
    if (savedRiotId) {
      setRiotId(savedRiotId);
    }
  }, []); // Load once on mount

  // Update Riot ID when currentSummoner changes (if not already set)
  useEffect(() => {
    if (currentSummoner && !riotId) {
      // If Riot ID is not in localStorage, try to get it from currentSummoner.name
      // But ideally it should be saved from the search
      const savedRiotId = StorageService.getRiotId();
      if (savedRiotId) {
        setRiotId(savedRiotId);
      }
    }
  }, [currentSummoner, riotId]);
  
  // Close both panels when search is successful
  const handleSearchSuccess = () => {
    setIsSearchExpanded(false);
    setIsApiKeyExpanded(false);
  };

  // Handle update button click
  const handleUpdate = async () => {
    if (!currentSummoner) {
      alert('サマナーが選択されていません');
      return;
    }

    setIsUpdating(true);
    setLoading(true);
    setError(null);

    try {
      const apiKey = StorageService.getApiKey();
      const region = StorageService.getApiRegion() || currentSummoner.region;
      
      if (!apiKey) {
        alert('APIキーが必要です。右上の「APIキー設定」からAPIキーを設定してください。');
        setIsUpdating(false);
        setLoading(false);
        return;
      }

      // 1. Update summoner info
      try {
        const summonerResponse = await fetch(`${API_ENDPOINTS.RIOT.SUMMONER_BY_PUUID}?puuid=${encodeURIComponent(currentSummoner.puuid)}&region=${region}&apiKey=${encodeURIComponent(apiKey)}`);
        if (summonerResponse.ok) {
          const summonerData = await summonerResponse.json();
          const updatedSummoner: Summoner = {
            ...summonerData,
            lastUpdated: new Date(),
          };
          setCurrentSummoner(updatedSummoner);
          
          // Save to database
          const { summonerService } = await import('@/lib/db');
          await summonerService.addOrUpdate(updatedSummoner);
        }
      } catch (error) {
        logger.warn('[Update] Failed to update summoner info:', error);
      }

      // 2. Update league entry
      try {
        const leagueResponse = await fetch(`${API_ENDPOINTS.RIOT.LEAGUE_BY_PUUID}?puuid=${encodeURIComponent(currentSummoner.puuid)}&region=${region}&apiKey=${encodeURIComponent(apiKey)}`);
        if (leagueResponse.ok) {
          const leagueData = await leagueResponse.json();
          if (leagueData.entry) {
            const entry = extractLeagueEntry(leagueData.entry);
            setCurrentLeagueEntry(entry);
          }
        }
      } catch (error) {
        logger.warn('[Update] Failed to update league entry:', error);
      }

      // 3. Fetch and update rate history
      try {
        const rateHistoryResponse = await fetch(API_ENDPOINTS.RIOT.FETCH_RATE_HISTORY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            puuid: currentSummoner.puuid,
            region: region,
            apiKey: apiKey,
            maxMatches: 100,
          }),
        });

        if (rateHistoryResponse.ok) {
          const result = await rateHistoryResponse.json();
          
          if (result.rateHistory && Array.isArray(result.rateHistory)) {
            let successCount = 0;
            let failedCount = 0;
            
            for (const entry of result.rateHistory) {
              try {
                await addRateHistory({
                  date: new Date(entry.date),
                  tier: entry.tier,
                  rank: entry.rank,
                  lp: entry.lp,
                  wins: entry.wins || 0,
                  losses: entry.losses || 0,
                });
                successCount++;
              } catch (error) {
                logger.error('[Update] Failed to add rate history entry:', error);
                failedCount++;
              }
            }
            
            logger.info(`[Update] Rate history updated: ${successCount} added/updated, ${failedCount} failed`);
          }

          // Update league entry if available
          if (result.currentEntry) {
            const entry: LeagueEntry = {
              leagueId: '',
              queueType: 'RANKED_SOLO_5x5',
              tier: result.currentEntry.tier,
              rank: result.currentEntry.rank,
              leaguePoints: result.currentEntry.lp,
              wins: result.currentEntry.wins,
              losses: result.currentEntry.losses,
              veteran: false,
              inactive: false,
              freshBlood: false,
              hotStreak: false,
            };
            setCurrentLeagueEntry(entry);
          }
        }
      } catch (error) {
        logger.warn('[Update] Failed to fetch rate history:', error);
      }

      alert('データを更新しました');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新に失敗しました';
      logger.error('[Update] Update error:', error);
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            NovaChart
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            LoL レート推移トラッカー & 分析ツール
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3">
            <SummonerSearch 
              isExpanded={isSearchExpanded} 
              setIsExpanded={setIsSearchExpanded}
              onSearchSuccess={handleSearchSuccess}
            />
          </div>
          <div>
            <ApiKeySettings 
              isExpanded={isApiKeyExpanded} 
              setIsExpanded={setIsApiKeyExpanded}
            />
          </div>
        </div>

        {(currentSummoner || riotId) && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Player Icon with Level Overlay - Always show if we have summoner data */}
                {currentSummoner ? (
                  <div className="relative">
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${currentSummoner.profileIconId}.png`}
                      alt="Profile Icon"
                      className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        // Fallback to a default icon if the image fails to load
                        (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/0.png`;
                      }}
                    />
                    {/* Level Badge */}
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-gray-800">
                      {currentSummoner.summonerLevel}
                    </div>
                  </div>
                ) : (
                  // Placeholder icon when summoner data is not available
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">?</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-lg">{riotId || currentSummoner?.name || 'サマナー未選択'}</p>
                    {currentSummoner && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentSummoner.region}
                      </p>
                    )}
                  </div>
                  {currentSummoner && (
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? '更新中...' : 'Update'}
                    </button>
                  )}
                </div>
              </div>
              
              {currentLeagueEntry && (
                <div className="text-right">
                  <p className="font-bold text-xl">
                    {currentLeagueEntry.tier} {currentLeagueEntry.rank}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentLeagueEntry.leaguePoints} LP | {currentLeagueEntry.wins}勝 {currentLeagueEntry.losses}敗
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RateChart />
          </div>
          <div className="space-y-6">
            <GoalSetting />
            <StatsPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
