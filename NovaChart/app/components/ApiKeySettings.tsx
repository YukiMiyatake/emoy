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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold mb-3">APIキー設定</h3>
      
      <div className="space-y-3">
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
      </div>
    </div>
  );
}

