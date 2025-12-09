'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { analyzeWinLoss, calculateDifferencePercentage, ImprovementSuggestion } from '@/lib/analytics/winLossAnalysis';

export default function WinLossAnalysis() {
  const { matches } = useAppStore();

  const analysis = useMemo(() => {
    return analyzeWinLoss(matches);
  }, [matches]);

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">勝敗分析</h2>
        <p className="text-gray-500">
          {matches.length === 0
            ? '試合データがありません'
            : '勝利試合または敗北試合のデータが不足しています'}
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: ImprovementSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    }
  };

  const getPriorityLabel = (priority: ImprovementSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">勝敗分析</h2>

      {/* 試合数サマリー */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">勝利試合</p>
          <p className="text-3xl font-bold">{analysis.wins.count}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            勝率: {Math.round((analysis.wins.count / (analysis.wins.count + analysis.losses.count)) * 100)}%
          </p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">敗北試合</p>
          <p className="text-3xl font-bold">{analysis.losses.count}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            敗率: {Math.round((analysis.losses.count / (analysis.wins.count + analysis.losses.count)) * 100)}%
          </p>
        </div>
      </div>

      {/* 主要指標の比較 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">主要指標の比較</h3>
        <div className="space-y-4">
          {/* KDA */}
          <ComparisonBar
            label="平均KDA"
            winValue={analysis.wins.averageKDA}
            lossValue={analysis.losses.averageKDA}
            difference={analysis.differences.kda}
            formatValue={(v) => v.toFixed(2)}
          />

          {/* CS/分 */}
          <ComparisonBar
            label="平均CS/分"
            winValue={analysis.wins.averageCSPerMin}
            lossValue={analysis.losses.averageCSPerMin}
            difference={analysis.differences.csPerMin}
            formatValue={(v) => v.toFixed(1)}
          />

          {/* ダメージ/分 */}
          <ComparisonBar
            label="平均ダメージ/分"
            winValue={analysis.wins.averageDamagePerMin}
            lossValue={analysis.losses.averageDamagePerMin}
            difference={analysis.differences.damagePerMin}
            formatValue={(v) => v.toLocaleString()}
          />

          {/* ビジョンスコア */}
          <ComparisonBar
            label="平均ビジョンスコア"
            winValue={analysis.wins.averageVisionScore}
            lossValue={analysis.losses.averageVisionScore}
            difference={analysis.differences.visionScore}
            formatValue={(v) => v.toFixed(1)}
          />

          {/* キル参加率 */}
          <ComparisonBar
            label="平均キル参加率"
            winValue={analysis.wins.averageKillParticipation}
            lossValue={analysis.losses.averageKillParticipation}
            difference={analysis.differences.killParticipation}
            formatValue={(v) => `${v.toFixed(1)}%`}
          />

          {/* 平均デス数 */}
          <ComparisonBar
            label="平均デス数"
            winValue={analysis.wins.averageDeaths}
            lossValue={analysis.losses.averageDeaths}
            difference={analysis.differences.deaths}
            formatValue={(v) => v.toFixed(1)}
            reverse={true} // デス数は少ない方が良い
          />
        </div>
      </div>

      {/* 詳細統計 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">詳細統計</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">勝利試合</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均キル</span>
                <span className="font-semibold">{analysis.wins.averageKills.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均デス</span>
                <span className="font-semibold">{analysis.wins.averageDeaths.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均アシスト</span>
                <span className="font-semibold">{analysis.wins.averageAssists.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均CS</span>
                <span className="font-semibold">{analysis.wins.averageCS}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均ダメージ</span>
                <span className="font-semibold">{analysis.wins.averageDamage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均ゴールド</span>
                <span className="font-semibold">{analysis.wins.averageGoldEarned.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">敗北試合</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均キル</span>
                <span className="font-semibold">{analysis.losses.averageKills.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均デス</span>
                <span className="font-semibold">{analysis.losses.averageDeaths.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均アシスト</span>
                <span className="font-semibold">{analysis.losses.averageAssists.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均CS</span>
                <span className="font-semibold">{analysis.losses.averageCS}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均ダメージ</span>
                <span className="font-semibold">{analysis.losses.averageDamage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">平均ゴールド</span>
                <span className="font-semibold">{analysis.losses.averageGoldEarned.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 改善提案 */}
      {analysis.improvementSuggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">改善提案</h3>
          <div className="space-y-3">
            {analysis.improvementSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  suggestion.priority === 'high'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : suggestion.priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(suggestion.priority)}`}>
                        {getPriorityLabel(suggestion.priority)}優先度
                      </span>
                      <span className="font-semibold">{suggestion.category}</span>
                      <span className="text-gray-600 dark:text-gray-400">-</span>
                      <span className="text-gray-600 dark:text-gray-400">{suggestion.metric}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion.description}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  現在: {typeof suggestion.currentValue === 'number' && suggestion.currentValue % 1 !== 0
                    ? suggestion.currentValue.toFixed(1)
                    : suggestion.currentValue.toLocaleString()} → 目標: {typeof suggestion.targetValue === 'number' && suggestion.targetValue % 1 !== 0
                    ? suggestion.targetValue.toFixed(1)
                    : suggestion.targetValue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ComparisonBarProps {
  label: string;
  winValue: number;
  lossValue: number;
  difference: number;
  formatValue: (value: number) => string;
  reverse?: boolean; // trueの場合、値が小さい方が良い（例: デス数）
}

function ComparisonBar({ label, winValue, lossValue, difference, formatValue, reverse = false }: ComparisonBarProps) {
  const maxValue = Math.max(winValue, lossValue);
  const winPercentage = maxValue > 0 ? (winValue / maxValue) * 100 : 0;
  const lossPercentage = maxValue > 0 ? (lossValue / maxValue) * 100 : 0;
  const isPositive = reverse ? difference < 0 : difference > 0;
  const diffPercentage = calculateDifferencePercentage(winValue, lossValue);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span
          className={`text-sm font-semibold ${
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {formatValue(difference)} ({diffPercentage > 0 ? '+' : ''}
          {diffPercentage}%)
        </span>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-600 dark:text-green-400">勝利</span>
            <span className="text-gray-600 dark:text-gray-400">{formatValue(winValue)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${winPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-600 dark:text-red-400">敗北</span>
            <span className="text-gray-600 dark:text-gray-400">{formatValue(lossValue)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-red-500 h-4 rounded-full"
              style={{ width: `${lossPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

