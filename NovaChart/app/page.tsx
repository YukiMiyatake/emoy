'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import SummonerSearch from './components/SummonerSearch';
import RateChart from './components/RateChart';
import GoalSetting from './components/GoalSetting';
import StatsPanel from './components/StatsPanel';
import ApiKeySettings from './components/ApiKeySettings';

export default function Home() {
  const { loadRateHistory, loadGoals, loadMatches } = useAppStore();

  useEffect(() => {
    // Load initial data
    loadRateHistory();
    loadGoals();
    loadMatches();
  }, [loadRateHistory, loadGoals, loadMatches]);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <SummonerSearch />
          </div>
          <div>
            <ApiKeySettings />
          </div>
        </div>

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
