'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Summoner, LeagueEntry } from '@/types';

const API_KEY_STORAGE_KEY = 'riot_api_key';
const API_REGION_STORAGE_KEY = 'riot_api_region';
const GAME_NAME_STORAGE_KEY = 'riot_game_name';
const TAG_LINE_STORAGE_KEY = 'riot_tag_line';

export default function SummonerSearch() {
  const { setCurrentSummoner, setCurrentLeagueEntry, setLoading, setError, currentSummoner, currentLeagueEntry } = useAppStore();
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('jp1');
  const [searchMode, setSearchMode] = useState<'riotId' | 'me'>('riotId');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Load saved values from localStorage
    const savedRegion = localStorage.getItem(API_REGION_STORAGE_KEY);
    const savedGameName = localStorage.getItem(GAME_NAME_STORAGE_KEY);
    const savedTagLine = localStorage.getItem(TAG_LINE_STORAGE_KEY);
    
    if (savedRegion) {
      setRegion(savedRegion);
    }
    if (savedGameName) {
      setGameName(savedGameName);
    }
    if (savedTagLine) {
      setTagLine(savedTagLine);
    }
  }, []);

  // Save gameName and tagLine to localStorage when they change
  useEffect(() => {
    if (gameName.trim()) {
      localStorage.setItem(GAME_NAME_STORAGE_KEY, gameName);
    }
  }, [gameName]);

  useEffect(() => {
    if (tagLine.trim()) {
      localStorage.setItem(TAG_LINE_STORAGE_KEY, tagLine);
    }
  }, [tagLine]);

  useEffect(() => {
    if (region) {
      localStorage.setItem(API_REGION_STORAGE_KEY, region);
    }
  }, [region]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchMode === 'riotId' && (!gameName.trim() || !tagLine.trim())) {
      const errorMsg = 'ゲーム名とタグラインを入力してください';
      console.error('[SummonerSearch] Validation error:', errorMsg);
      alert(errorMsg);
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      const currentRegion = localStorage.getItem(API_REGION_STORAGE_KEY) || region;
      
      let response;
      if (searchMode === 'me') {
        // Use /me endpoint (requires API key)
        if (!apiKey) {
          const errorMsg = 'APIキーが必要です。右上の「APIキー設定」からAPIキーを設定してください。';
          console.error('[SummonerSearch] API key required (me mode):', errorMsg);
          alert(errorMsg);
          setIsSearching(false);
          setLoading(false);
          return;
        }
        const url = `/api/riot/account/me?region=${currentRegion}&apiKey=${encodeURIComponent(apiKey)}`;
        response = await fetch(url);
        
        if (response.ok) {
          const account = await response.json();
          console.log('[SummonerSearch] Account data:', account);
          
          // Get summoner info using PUUID (no id needed, use client directly)
          const { RiotApiClient } = await import('@/lib/riot/client');
          const client = new RiotApiClient(apiKey, currentRegion);
          const summonerData = await client.getSummonerByPuuid(account.puuid);
          
          console.log('[SummonerSearch] Summoner response data:', summonerData);
          
          // Validate summoner data - only puuid is required
          if (!summonerData || !summonerData.puuid) {
            console.error('[SummonerSearch] Invalid summoner data:', summonerData);
            throw new Error('サマナー情報が不正です。puuidが存在しません。');
          }
          
          // Convert lastUpdated from string to Date if needed
          const summoner: Summoner = {
            ...summonerData,
            lastUpdated: summonerData.lastUpdated instanceof Date 
              ? summonerData.lastUpdated 
              : new Date(summonerData.lastUpdated),
          };
          
          console.log('[SummonerSearch] Processed summoner:', summoner);
          
          setCurrentSummoner(summoner);
          
          // Fetch league entry to display current rank
          try {
            const leagueResponse = await fetch(`/api/riot/league-by-puuid?puuid=${encodeURIComponent(summoner.puuid)}&region=${currentRegion}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`);
            if (leagueResponse.ok) {
              const leagueData = await leagueResponse.json();
              if (leagueData.entry) {
                // Extract only LeagueEntry fields to avoid including extra fields
                const entry: LeagueEntry = {
                  leagueId: leagueData.entry.leagueId || '',
                  queueType: leagueData.entry.queueType || '',
                  tier: leagueData.entry.tier || '',
                  rank: leagueData.entry.rank || '',
                  leaguePoints: leagueData.entry.leaguePoints || 0,
                  wins: leagueData.entry.wins || 0,
                  losses: leagueData.entry.losses || 0,
                  veteran: leagueData.entry.veteran || false,
                  inactive: leagueData.entry.inactive || false,
                  freshBlood: leagueData.entry.freshBlood || false,
                  hotStreak: leagueData.entry.hotStreak || false,
                };
                setCurrentLeagueEntry(entry);
              }
            }
          } catch (error) {
            console.error('[SummonerSearch] Failed to fetch league entry (from /me):', error);
            // Don't throw - we can still use the summoner even if league fetch fails
          }
          
          // Save to database on client-side
          try {
            const { summonerService } = await import('@/lib/db');
            await summonerService.addOrUpdate(summoner);
            console.log('[SummonerSearch] Summoner saved to database successfully');
          } catch (error) {
            console.error('[SummonerSearch] Failed to save summoner to database:', error);
            // Don't throw - we can still use the summoner even if save fails
          }
          
          // Automatically fetch rate history from match history
          await fetchAndSaveRateHistory(summoner.puuid, currentRegion, apiKey);
          
          setIsSearching(false);
          setLoading(false);
          return;
        }
        // Fall through to error handling
      } else if (searchMode === 'riotId') {
        // Use by-riot-id endpoint
        if (!apiKey) {
          const errorMsg = 'APIキーが必要です。右上の「APIキー設定」からAPIキーを設定してください。';
          console.error('[SummonerSearch] API key required (riotId mode):', errorMsg);
          alert(errorMsg);
          setIsSearching(false);
          setLoading(false);
          return;
        }
        const url = `/api/riot/account/by-riot-id?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${currentRegion}&apiKey=${encodeURIComponent(apiKey)}`;
        response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[SummonerSearch] Response data:', data);
          console.log('[SummonerSearch] Response data type:', typeof data);
          console.log('[SummonerSearch] Response data keys:', data ? Object.keys(data) : 'data is null/undefined');
          console.log('[SummonerSearch] data.summoner:', data?.summoner);
          console.log('[SummonerSearch] data.account:', data?.account);
          
          // Check if data has summoner property or is the summoner itself
          const summonerData = data?.summoner || data;
          console.log('[SummonerSearch] Summoner data:', summonerData);
          console.log('[SummonerSearch] Summoner data type:', typeof summonerData);
          console.log('[SummonerSearch] Summoner data keys:', summonerData ? Object.keys(summonerData) : 'summonerData is null/undefined');
          console.log('[SummonerSearch] Summoner id:', summonerData?.id);
          console.log('[SummonerSearch] Summoner id type:', typeof summonerData?.id);
          console.log('[SummonerSearch] Summoner puuid:', summonerData?.puuid);
          console.log('[SummonerSearch] Summoner puuid type:', typeof summonerData?.puuid);
          
          if (!summonerData) {
            console.error('[SummonerSearch] Summoner data is null or undefined');
            console.error('[SummonerSearch] Full response data:', JSON.stringify(data, null, 2));
            const errorMsg = 'サマナー情報が不正です。レスポンスにサマナー情報が含まれていません。';
            console.error('[SummonerSearch] Error:', errorMsg);
            throw new Error(errorMsg);
          }
          
          // Check if puuid exists (required)
          if (!summonerData.puuid) {
            console.error('[SummonerSearch] Invalid summoner data - missing puuid');
            console.error('[SummonerSearch] Summoner data:', JSON.stringify(summonerData, null, 2));
            console.error('[SummonerSearch] Full response data:', JSON.stringify(data, null, 2));
            const errorMsg = `サマナー情報が不正です。puuidが存在しません。`;
            console.error('[SummonerSearch] Error:', errorMsg);
            throw new Error(errorMsg);
          }
          
          // If name is missing, fetch from summoner API using puuid
          if (!summonerData.name) {
            console.warn('[SummonerSearch] Summoner name is missing, fetching from API...');
            try {
              const { RiotApiClient } = await import('@/lib/riot/client');
              const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
              const currentRegion = localStorage.getItem(API_REGION_STORAGE_KEY) || region;
              if (apiKey) {
                const client = new RiotApiClient(apiKey, currentRegion);
                const fullSummonerData = await client.getSummonerByPuuid(summonerData.puuid);
                console.log('[SummonerSearch] Fetched full summoner data:', fullSummonerData);
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
                console.log('[SummonerSearch] Updated summonerData:', summonerData);
              }
            } catch (error) {
              console.warn('[SummonerSearch] Error fetching summoner name:', error);
            }
          }
          
          // Convert lastUpdated from string to Date if needed
          const summoner: Summoner = {
            ...summonerData,
            lastUpdated: summonerData.lastUpdated instanceof Date 
              ? summonerData.lastUpdated 
              : new Date(summonerData.lastUpdated),
          };
          
          console.log('[SummonerSearch] Processed summoner:', summoner);
          
          setCurrentSummoner(summoner);
          
          // Fetch league entry to display current rank
          try {
            const leagueResponse = await fetch(`/api/riot/league-by-puuid?puuid=${encodeURIComponent(summoner.puuid)}&region=${currentRegion}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`);
            if (leagueResponse.ok) {
              const leagueData = await leagueResponse.json();
              if (leagueData.entry) {
                // Extract only LeagueEntry fields to avoid including extra fields
                const entry: LeagueEntry = {
                  leagueId: leagueData.entry.leagueId || '',
                  queueType: leagueData.entry.queueType || '',
                  tier: leagueData.entry.tier || '',
                  rank: leagueData.entry.rank || '',
                  leaguePoints: leagueData.entry.leaguePoints || 0,
                  wins: leagueData.entry.wins || 0,
                  losses: leagueData.entry.losses || 0,
                  veteran: leagueData.entry.veteran || false,
                  inactive: leagueData.entry.inactive || false,
                  freshBlood: leagueData.entry.freshBlood || false,
                  hotStreak: leagueData.entry.hotStreak || false,
                };
                setCurrentLeagueEntry(entry);
              }
            }
          } catch (error) {
            console.error('[SummonerSearch] Failed to fetch league entry:', error);
            // Don't throw - we can still use the summoner even if league fetch fails
          }
          
          // Save to database on client-side
          try {
            const { summonerService } = await import('@/lib/db');
            await summonerService.addOrUpdate(summoner);
            console.log('[SummonerSearch] Summoner saved to database successfully');
          } catch (error) {
            console.error('[SummonerSearch] Failed to save summoner to database:', error);
            // Don't throw - we can still use the summoner even if save fails
          }
          
          // Automatically fetch rate history from match history
          await fetchAndSaveRateHistory(summoner.puuid, currentRegion, apiKey);
          
          setIsSearching(false);
          setLoading(false);
          return;
        }
        
        // Handle error response for riotId mode
        if (!response.ok) {
          const error = await response.json();
          const errorMessage = error.error || 'サマナーが見つかりませんでした';
          
          // Provide more helpful error messages
          if (response.status === 403) {
            throw new Error('APIキーが無効または権限がありません。右上の「APIキー設定」で正しいAPIキーを設定してください。開発用APIキーは24時間で期限切れになります。');
          } else if (response.status === 401 || response.status === 500) {
            // Check if it's an API key configuration error
            if (error.error && error.error.includes('not configured')) {
              throw new Error('APIキーが設定されていません。右上の「APIキー設定」からAPIキーを入力してください。');
            }
            throw new Error(errorMessage);
          } else if (response.status === 404) {
            throw new Error('サマナーが見つかりませんでした。入力内容とリージョンを確認してください。');
          } else if (response.status === 429) {
            throw new Error('APIレート制限に達しました。しばらく待ってから再試行してください。');
          }
          
          throw new Error(errorMessage);
        }
      }
      
      // Handle error response for me mode
      if (searchMode === 'me' && !response.ok) {
        const error = await response.json();
        const errorMessage = error.error || 'アカウント情報の取得に失敗しました';
        
        // Provide more helpful error messages
        if (response.status === 403) {
          throw new Error('APIキーが無効または権限がありません。右上の「APIキー設定」で正しいAPIキーを設定してください。開発用APIキーは24時間で期限切れになります。');
        } else if (response.status === 401 || response.status === 500) {
          if (error.error && error.error.includes('not configured')) {
            throw new Error('APIキーが設定されていません。右上の「APIキー設定」からAPIキーを入力してください。');
          }
          throw new Error(errorMessage);
        } else if (response.status === 404) {
          throw new Error('アカウント情報が見つかりませんでした。');
        } else if (response.status === 429) {
          throw new Error('APIレート制限に達しました。しばらく待ってから再試行してください。');
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '検索に失敗しました';
      console.error('[SummonerSearch] Search error:', error);
      console.error('[SummonerSearch] Error message:', errorMessage);
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
        console.warn('[SummonerSearch] API key not available for rate history fetch');
        return;
      }

      console.log('[SummonerSearch] Automatically fetching rate history from match history...');
      const response = await fetch('/api/riot/fetch-rate-history', {
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
        console.warn('[SummonerSearch] Failed to fetch rate history:', errorMessage);
        return; // Don't throw - just log and continue
      }

      const result = await response.json();
      console.log('[SummonerSearch] Rate history fetched:', result);
      console.log('[SummonerSearch] Rate history entries:', result.rateHistory?.length || 0);

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
          const dateKey = `${entryDate.getFullYear()}-${entryDate.getMonth()}-${entryDate.getDate()}`;
          existingByDate.set(dateKey, (existingByDate.get(dateKey) || 0) + 1);
        });
        
        for (const entry of result.rateHistory) {
          try {
            const entryDate = new Date(entry.date);
            const dateKey = `${entryDate.getFullYear()}-${entryDate.getMonth()}-${entryDate.getDate()}`;
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
            console.error('[SummonerSearch] Error saving rate history entry:', error);
          }
        }
        
        console.log(`[SummonerSearch] Rate history saved: ${addedCount} added, ${updatedCount} updated, ${failedCount} failed`);
      }

      // Update current league entry if not already set
      const currentState = useAppStore.getState();
      if (result.currentEntry && !currentState.currentLeagueEntry) {
        setCurrentLeagueEntry({
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
        });
      }

      console.log(`[SummonerSearch] Rate history fetched and saved: ${result.rateHistory?.length || 0} entries`);
    } catch (error) {
      console.warn('[SummonerSearch] Error fetching rate history, but continuing:', error);
      // Don't throw - we can still use the summoner even if rate history fetch fails
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {currentSummoner && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-base">現在のサマナー: {currentSummoner.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {currentSummoner.region} | Lv.{currentSummoner.summonerLevel}
              </p>
            </div>
            {currentLeagueEntry && (
              <div className="text-right">
                <p className="font-bold text-lg">
                  {currentLeagueEntry.tier} {currentLeagueEntry.rank}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentLeagueEntry.leaguePoints} LP | {currentLeagueEntry.wins}勝 {currentLeagueEntry.losses}敗
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex gap-3">
            <label className="flex items-center text-sm">
              <input
                type="radio"
                value="riotId"
                checked={searchMode === 'riotId'}
                onChange={(e) => setSearchMode(e.target.value as 'riotId')}
                className="mr-1.5"
              />
              Riot ID
            </label>
            <label className="flex items-center text-sm">
              <input
                type="radio"
                value="me"
                checked={searchMode === 'me'}
                onChange={(e) => setSearchMode(e.target.value as 'me')}
                className="mr-1.5"
              />
              自分のアカウント
            </label>
          </div>
        </div>

        {searchMode === 'riotId' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">ゲーム名</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="ゲーム名"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">タグライン</label>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="タグライン"
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
        )}

        {searchMode === 'me' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">APIキーで認証された自分のアカウント情報を取得します</p>
            </div>
            <div className="w-24">
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
        )}

        <button
          type="submit"
          disabled={isSearching}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSearching ? '検索中...' : '検索'}
        </button>
      </form>
    </div>
  );
}

