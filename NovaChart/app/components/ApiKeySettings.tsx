'use client';

import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'riot_api_key';
const API_REGION_STORAGE_KEY = 'riot_api_region';

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState('jp1');
  const [isSaved, setIsSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const savedRegion = localStorage.getItem(API_REGION_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
    if (savedRegion) {
      setRegion(savedRegion);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      localStorage.setItem(API_REGION_STORAGE_KEY, region);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(API_REGION_STORAGE_KEY);
    setApiKey('');
    setRegion('jp1');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">APIキー設定</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Riot Games APIキー
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showKey ? '非表示' : '表示'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            APIキーは{' '}
            <a 
              href="https://developer.riotgames.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Riot Developer Portal
            </a>
            で取得できます
          </p>
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

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaved ? '保存しました' : '保存'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            クリア
          </button>
        </div>

        {apiKey && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm">
            <p className="font-semibold">現在の設定:</p>
            <p>リージョン: {region}</p>
            <p>APIキー: {apiKey.substring(0, 10)}...{apiKey.substring(apiKey.length - 4)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

