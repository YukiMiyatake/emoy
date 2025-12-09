'use client';

import { useState, useEffect } from 'react';
import { STORAGE_KEYS, DEFAULTS } from '@/lib/constants';
import { StorageService } from '@/lib/utils/storage';

interface ApiKeySettingsProps {
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
}

export default function ApiKeySettings({ 
  isExpanded: isExpandedProp, 
  setIsExpanded: setIsExpandedProp 
}: ApiKeySettingsProps = {}) {
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState(DEFAULTS.REGION);
  const [isSaved, setIsSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(true);
  
  // Use prop if provided, otherwise use internal state
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : internalExpanded;
  const setIsExpanded = setIsExpandedProp || setInternalExpanded;

  useEffect(() => {
    // Load from localStorage
    const savedKey = StorageService.getApiKey();
    const savedRegion = StorageService.getApiRegion();
    if (savedKey) {
      setApiKey(savedKey);
    }
    if (savedRegion) {
      setRegion(savedRegion);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      StorageService.setApiKey(apiKey);
      StorageService.setApiRegion(region);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClear = () => {
    StorageService.removeApiKey();
    StorageService.removeApiRegion();
    setApiKey('');
    setRegion(DEFAULTS.REGION);
  };

  const handleDeleteAllData = async () => {
    if (!confirm('すべてのデータベース情報を削除しますか？この操作は取り消せません。\n\n削除されるデータ:\n- レート履歴\n- 目標設定\n- 試合詳細\n- サマナー情報\n- リーグエントリー')) {
      return;
    }

    try {
      const { rateHistoryService, goalService, matchService, summonerService, leagueEntryService } = await import('@/lib/db');
      
      await Promise.all([
        rateHistoryService.deleteAll(),
        goalService.deleteAll?.() || Promise.resolve(),
        matchService.deleteAll(),
        summonerService.deleteAll?.() || Promise.resolve(),
        leagueEntryService.deleteAll(),
      ]);

      // ストアもリセット
      const { useAppStore } = await import('@/lib/store/useAppStore');
      useAppStore.getState().loadRateHistory();
      useAppStore.getState().loadGoals();
      useAppStore.getState().loadMatches();
      useAppStore.getState().setCurrentSummoner(null);
      useAppStore.getState().setCurrentLeagueEntry(null);

      alert('すべてのデータベース情報を削除しました');
    } catch (error) {
      console.error('Failed to delete all data:', error);
      alert('データの削除に失敗しました');
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
          <span>APIキー設定</span>
        </button>
      </div>
      
      {isExpanded && (
        <div className="space-y-3 mt-3">
        <div>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="RGAPI-..."
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {showKey ? '非表示' : '表示'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <a 
              href="https://developer.riotgames.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Riot Developer Portal
            </a>
            で取得
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSaved ? '保存しました' : '保存'}
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            クリア
          </button>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">デバッグ用</p>
          <button
            onClick={handleDeleteAllData}
            className="w-full px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            DB情報全削除
          </button>
        </div>
        </div>
      )}
    </div>
  );
}

