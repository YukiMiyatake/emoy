'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { calculateStatistics, calculateProgress, calculateRequiredMatches } from '@/lib/analytics/progress';

export default function StatsPanel() {
  const { rateHistory, goals, matches, currentLeagueEntry } = useAppStore();

  // Filter rateHistory to only include solo queue (RANKED_SOLO_5x5) data
  // Since RateHistory doesn't have queueType, we'll use currentLeagueEntry for current stats
  // and filter rateHistory based on the assumption that it's mostly solo queue data
  // For now, we'll use currentLeagueEntry for wins/losses/winRate and rateHistory for LP changes
  const soloQueueRateHistory = rateHistory; // Assume all rateHistory is solo queue for now
  
  // Extract only needed fields from currentLeagueEntry to avoid passing the full object
  const leagueEntryForStats = currentLeagueEntry ? {
    queueType: currentLeagueEntry.queueType,
    wins: currentLeagueEntry.wins,
    losses: currentLeagueEntry.losses,
    tier: currentLeagueEntry.tier,
    rank: currentLeagueEntry.rank,
    leaguePoints: currentLeagueEntry.leaguePoints,
  } : null;
  
  const stats = calculateStatistics(soloQueueRateHistory, leagueEntryForStats);
  const activeGoal = goals.find(g => g.isActive);
  const progress = activeGoal ? calculateProgress(soloQueueRateHistory, activeGoal) : null;
  const requiredMatches = activeGoal ? calculateRequiredMatches(soloQueueRateHistory, matches, activeGoal, 3, leagueEntryForStats) : null;

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">統計情報</h2>
        <p className="text-gray-500">データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">統計情報</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">現在のランク</p>
          <p className="text-2xl font-bold">
            {stats.currentTier} {stats.currentRank}
          </p>
          <p className="text-sm">{stats.currentLP} LP</p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">勝率</p>
          <p className="text-2xl font-bold">{stats.winRate}%</p>
          <p className="text-sm">{stats.wins}勝 {stats.losses}敗</p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">総試合数</p>
          <p className="text-2xl font-bold">{stats.totalGames}</p>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">LP変動</p>
          <p className={`text-2xl font-bold ${stats.totalLPChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalLPChange >= 0 ? '+' : ''}{stats.totalLPChange}
          </p>
        </div>
      </div>

      {progress && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 className="text-lg font-semibold mb-2">目標への進捗</h3>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>進捗率</span>
              <span>{progress.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${Math.min(100, progress.progressPercentage)}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">残りLP</p>
              <p className="font-semibold">{progress.lpRemaining} LP</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">予測日数</p>
              <p className="font-semibold">{progress.daysRemaining} 日</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">1日あたりのLP</p>
              <p className="font-semibold">{progress.averageLPPerDay} LP</p>
            </div>
          </div>
        </div>
      )}

      {requiredMatches && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900 rounded">
          <h3 className="text-lg font-semibold mb-2">必要試合数</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">必要試合数</p>
              <p className="font-semibold text-xl">{requiredMatches.matchesNeeded} 試合</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">必要日数</p>
              <p className="font-semibold text-xl">{requiredMatches.daysNeeded} 日</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">現在の勝率</p>
              <p className="font-semibold">{requiredMatches.winRate}%</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">1日あたりの試合数</p>
              <p className="font-semibold">{requiredMatches.matchesPerDay} 試合</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

