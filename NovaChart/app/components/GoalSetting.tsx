'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Goal } from '@/types';

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const RANKS = ['IV', 'III', 'II', 'I'];

export default function GoalSetting() {
  const { goals, addGoal, loadGoals } = useAppStore();
  const [targetTier, setTargetTier] = useState('GOLD');
  const [targetRank, setTargetRank] = useState('I');
  const [targetLP, setTargetLP] = useState(0);
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
    // Set default target date to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setTargetDate(defaultDate.toISOString().split('T')[0]);
  }, [loadGoals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) {
      alert('目標日付を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await addGoal({
        targetDate: new Date(targetDate),
        targetTier: targetTier,
        targetRank: targetTier === 'MASTER' || targetTier === 'GRANDMASTER' || targetTier === 'CHALLENGER' ? '' : targetRank,
        targetLP: targetLP,
        createdAt: new Date(),
        isActive: true,
      });
      alert('目標を設定しました');
      // Reset form
      setTargetLP(0);
    } catch (error) {
      alert('目標の設定に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGoal = goals.find(g => g.isActive);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">目標設定</h2>
      
      {activeGoal && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <p className="font-semibold">現在の目標:</p>
          <p>
            {activeGoal.targetTier} {activeGoal.targetRank} {activeGoal.targetLP}LP
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            目標日: {new Date(activeGoal.targetDate).toLocaleDateString('ja-JP')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">ティア</label>
            <select
              value={targetTier}
              onChange={(e) => setTargetTier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIERS.map(tier => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>

          {targetTier !== 'MASTER' && targetTier !== 'GRANDMASTER' && targetTier !== 'CHALLENGER' && (
            <div>
              <label className="block text-sm font-medium mb-2">ランク</label>
              <select
                value={targetRank}
                onChange={(e) => setTargetRank(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RANKS.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">目標LP</label>
          <input
            type="number"
            value={targetLP}
            onChange={(e) => setTargetLP(parseInt(e.target.value) || 0)}
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">目標日付</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '設定中...' : '目標を設定'}
        </button>
      </form>
    </div>
  );
}

