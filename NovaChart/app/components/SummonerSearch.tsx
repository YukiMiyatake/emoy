'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Summoner } from '@/types';

const API_KEY_STORAGE_KEY = 'riot_api_key';
const API_REGION_STORAGE_KEY = 'riot_api_region';

export default function SummonerSearch() {
  const { setCurrentSummoner, setLoading, setError, currentSummoner } = useAppStore();
  const [summonerName, setSummonerName] = useState('');
  const [summonerId, setSummonerId] = useState('');
  const [puuid, setPuuid] = useState('');
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('jp1');
  const [searchMode, setSearchMode] = useState<'name' | 'id' | 'puuid' | 'riotId' | 'me'>('name');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Load region from localStorage
    const savedRegion = localStorage.getItem(API_REGION_STORAGE_KEY);
    if (savedRegion) {
      setRegion(savedRegion);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchMode === 'name' && !summonerName.trim()) {
      alert('サマナー名を入力してください');
      return;
    } else if (searchMode === 'id' && !summonerId.trim()) {
      alert('サマナーIDを入力してください');
      return;
    } else if (searchMode === 'puuid' && !puuid.trim()) {
      alert('PUUIDを入力してください');
      return;
    } else if (searchMode === 'riotId' && (!gameName.trim() || !tagLine.trim())) {
      alert('ゲーム名とタグラインを入力してください');
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
          alert('APIキーが必要です。右上の「APIキー設定」からAPIキーを設定してください。');
          setIsSearching(false);
          setLoading(false);
          return;
        }
        const url = `/api/riot/account/me?region=${currentRegion}&apiKey=${encodeURIComponent(apiKey)}`;
        response = await fetch(url);
        
        if (response.ok) {
          const account = await response.json();
          // Get summoner info using PUUID
          const summonerResponse = await fetch(`/api/riot/summoner-by-id?puuid=${encodeURIComponent(account.puuid)}&region=${currentRegion}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`);
          if (summonerResponse.ok) {
            const summoner: Summoner = await summonerResponse.json();
            setCurrentSummoner(summoner);
            setIsSearching(false);
            setLoading(false);
            return;
          } else {
            // Handle summoner fetch error
            const error = await summonerResponse.json();
            throw new Error(error.error || 'サマナー情報の取得に失敗しました');
          }
        }
        // Fall through to error handling
      } else if (searchMode === 'riotId') {
        // Use by-riot-id endpoint
        if (!apiKey) {
          alert('APIキーが必要です。右上の「APIキー設定」からAPIキーを設定してください。');
          setIsSearching(false);
          setLoading(false);
          return;
        }
        const url = `/api/riot/account/by-riot-id?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${currentRegion}&apiKey=${encodeURIComponent(apiKey)}`;
        response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setCurrentSummoner(data.summoner);
          setIsSearching(false);
          setLoading(false);
          return;
        }
        // Fall through to error handling
      } else if (searchMode === 'name') {
        const url = `/api/riot/summoner?name=${encodeURIComponent(summonerName)}&region=${currentRegion}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`;
        response = await fetch(url);
      } else if (searchMode === 'id') {
        const url = `/api/riot/summoner-by-id?summonerId=${encodeURIComponent(summonerId)}&region=${currentRegion}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`;
        response = await fetch(url);
      } else {
        const url = `/api/riot/summoner-by-id?puuid=${encodeURIComponent(puuid)}&region=${currentRegion}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`;
        response = await fetch(url);
      }
      
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
          throw new Error('サマナーが見つかりませんでした。サマナー名とリージョンを確認してください。');
        } else if (response.status === 429) {
          throw new Error('APIレート制限に達しました。しばらく待ってから再試行してください。');
        }
        
        throw new Error(errorMessage);
      }

      const summoner: Summoner = await response.json();
      setCurrentSummoner(summoner);
    } catch (error) {
      setError(error instanceof Error ? error.message : '検索に失敗しました');
      alert(error instanceof Error ? error.message : '検索に失敗しました');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleUpdateRating = async () => {
    // Use current summoner if available, otherwise check input
    const hasInput = (searchMode === 'name' && summonerName.trim()) ||
                     (searchMode === 'id' && summonerId.trim()) ||
                     (searchMode === 'puuid' && puuid.trim()) ||
                     currentSummoner;

    if (!hasInput) {
      alert('サマナー情報を入力するか、検索してください');
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      const currentRegion = localStorage.getItem(API_REGION_STORAGE_KEY) || region;
      
      const body: any = { region: currentRegion };
      if (apiKey) {
        body.apiKey = apiKey;
      }
      if (currentSummoner) {
        body.summonerId = currentSummoner.id;
        body.puuid = currentSummoner.puuid;
      } else if (searchMode === 'name') {
        body.summonerName = summonerName;
      } else if (searchMode === 'id') {
        body.summonerId = summonerId;
      } else if (searchMode === 'puuid') {
        body.puuid = puuid;
      }

      const response = await fetch('/api/riot/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || 'レートの更新に失敗しました';
        
        // Provide more helpful error messages
        if (response.status === 403) {
          // Extract API endpoint from error message if available
          let apiEndpoint = 'GET /lol/league/v4/entries/by-summoner/{summonerId}';
          if (errorMessage.includes('エラー発生API:')) {
            const match = errorMessage.match(/エラー発生API:\s*([^\n]+)/);
            if (match) {
              apiEndpoint = match[1].trim();
            }
          }
          throw new Error(`APIキーが無効または権限がありません。\nエラー発生API: ${apiEndpoint}\n右上の「APIキー設定」で正しいAPIキーを設定してください。開発用APIキーは24時間で期限切れになります。`);
        } else if (response.status === 401 || response.status === 500) {
          if (errorMessage.includes('not configured')) {
            throw new Error('APIキーが設定されていません。右上の「APIキー設定」からAPIキーを入力してください。');
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      alert('レートを更新しました');
      
      // Reload rate history
      await useAppStore.getState().loadRateHistory();
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新に失敗しました');
      alert(error instanceof Error ? error.message : '更新に失敗しました');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">サマナー検索</h2>
      
      {currentSummoner && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <p className="font-semibold">現在のサマナー:</p>
          <p>{currentSummoner.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ID: {currentSummoner.id} | PUUID: {currentSummoner.puuid.substring(0, 20)}...
          </p>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">検索方法</label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="name"
                checked={searchMode === 'name'}
                onChange={(e) => setSearchMode(e.target.value as 'name')}
                className="mr-2"
              />
              サマナー名
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="id"
                checked={searchMode === 'id'}
                onChange={(e) => setSearchMode(e.target.value as 'id')}
                className="mr-2"
              />
              サマナーID
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="puuid"
                checked={searchMode === 'puuid'}
                onChange={(e) => setSearchMode(e.target.value as 'puuid')}
                className="mr-2"
              />
              PUUID
            </label>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {searchMode === 'me' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded">
                <p className="text-sm">APIキーで認証された自分のアカウント情報を取得します</p>
              </div>
            )}
            {searchMode === 'riotId' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1">ゲーム名</label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="ゲーム名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">タグライン</label>
                  <input
                    type="text"
                    value={tagLine}
                    onChange={(e) => setTagLine(e.target.value)}
                    placeholder="タグラインを入力（例: JP1）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            {searchMode !== 'me' && searchMode !== 'riotId' && (
              <>
                <label className="block text-sm font-medium mb-2">
                  {searchMode === 'name' ? 'サマナー名' : searchMode === 'id' ? 'サマナーID' : 'PUUID'}
                </label>
                {searchMode === 'name' && (
                  <input
                    type="text"
                    value={summonerName}
                    onChange={(e) => setSummonerName(e.target.value)}
                    placeholder="サマナー名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {searchMode === 'id' && (
                  <input
                    type="text"
                    value={summonerId}
                    onChange={(e) => setSummonerId(e.target.value)}
                    placeholder="サマナーIDを入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {searchMode === 'puuid' && (
                  <input
                    type="text"
                    value={puuid}
                    onChange={(e) => setPuuid(e.target.value)}
                    placeholder="PUUIDを入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">リージョン</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="jp1">JP</option>
              <option value="kr">KR</option>
              <option value="na1">NA</option>
              <option value="euw1">EUW</option>
              <option value="eun1">EUN</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSearching}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? '検索中...' : '検索'}
          </button>
          <button
            type="button"
            onClick={handleUpdateRating}
            disabled={isSearching}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? '更新中...' : 'レート更新'}
          </button>
        </div>
      </form>
    </div>
  );
}

