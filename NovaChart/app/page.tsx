'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import SummonerSearch from './components/SummonerSearch';
import RateChart from './components/RateChart';
import GoalSetting from './components/GoalSetting';
import StatsPanel from './components/StatsPanel';
import ApiKeySettings from './components/ApiKeySettings';
import { Summoner, LeagueEntry } from '@/types';

export default function Home() {
  const { loadRateHistory, loadGoals, loadMatches, currentSummoner, currentLeagueEntry } = useAppStore();
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [isApiKeyExpanded, setIsApiKeyExpanded] = useState(true);
  const [riotId, setRiotId] = useState<string>('');

  useEffect(() => {
    // Load initial data
    loadRateHistory();
    loadGoals();
    loadMatches();
  }, [loadRateHistory, loadGoals, loadMatches]);

  useEffect(() => {
    // Load Riot ID from localStorage
    if (typeof window !== 'undefined') {
      const savedRiotId = localStorage.getItem('riot_id');
      if (savedRiotId) {
        setRiotId(savedRiotId);
      }
    }
  }, [currentSummoner]); // Update when currentSummoner changes
  
  // Close both panels when search is successful
  const handleSearchSuccess = () => {
    setIsSearchExpanded(false);
    setIsApiKeyExpanded(false);
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

        {currentSummoner && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Player Icon with Level Overlay */}
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
                
                <div>
                  <p className="font-semibold text-lg">{riotId || currentSummoner.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentSummoner.region}
                  </p>
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
