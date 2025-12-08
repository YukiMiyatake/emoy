'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Goal } from '@/types';

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const RANKS = ['IV', 'III', 'II', 'I'];

export default function GoalSetting() {
  const { goals, addGoal, updateGoal, deleteGoal, loadGoals } = useAppStore();
  const [targetTier, setTargetTier] = useState('GOLD');
  const [targetRank, setTargetRank] = useState('I');
  const [targetLP, setTargetLP] = useState(0);
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(false);

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
      if (editingGoal && editingGoal.id) {
        // Update existing goal
        await updateGoal(editingGoal.id, {
          targetDate: new Date(targetDate),
          targetTier: targetTier,
          targetRank: targetTier === 'MASTER' || targetTier === 'GRANDMASTER' || targetTier === 'CHALLENGER' ? '' : targetRank,
          targetLP: targetLP,
        });
        alert('目標を更新しました');
        setEditingGoal(null);
      } else {
        // Add new goal
        await addGoal({
          targetDate: new Date(targetDate),
          targetTier: targetTier,
          targetRank: targetTier === 'MASTER' || targetTier === 'GRANDMASTER' || targetTier === 'CHALLENGER' ? '' : targetRank,
          targetLP: targetLP,
          createdAt: new Date(),
          isActive: true,
        });
        alert('目標を設定しました');
      }
      // Reset form
      setTargetLP(0);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
      setTargetTier('GOLD');
      setTargetRank('I');
    } catch (error) {
      alert(editingGoal ? '目標の更新に失敗しました' : '目標の設定に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTargetTier(goal.targetTier);
    setTargetRank(goal.targetRank || 'I');
    setTargetLP(goal.targetLP);
    setTargetDate(new Date(goal.targetDate).toISOString().split('T')[0]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この目標を削除しますか？')) {
      return;
    }
    try {
      await deleteGoal(id);
      alert('目標を削除しました');
    } catch (error) {
      alert('目標の削除に失敗しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setTargetTier('GOLD');
    setTargetRank('I');
    setTargetLP(0);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setTargetDate(defaultDate.toISOString().split('T')[0]);
  };

  // Sort goals by target date
  const sortedGoals = [...goals].sort((a, b) => 
    new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">目標設定</h2>
      
      {sortedGoals.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setIsGoalsExpanded(!isGoalsExpanded)}
            className="w-full flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <h3 className="text-lg font-semibold">
              設定済みの目標 ({sortedGoals.length})
            </h3>
            <span className="text-gray-600 dark:text-gray-400">
              {isGoalsExpanded ? '▼' : '▶'}
            </span>
          </button>
          {isGoalsExpanded && (
            <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
              {sortedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {goal.targetTier} {goal.targetRank} {goal.targetLP}LP
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        目標日: {new Date(goal.targetDate).toLocaleDateString('ja-JP')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        作成日: {new Date(goal.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => goal.id && handleDelete(goal.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold">
          {editingGoal ? '目標を編集' : '新しい目標を追加'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">ティア</label>
            <select
              value={targetTier}
              onChange={(e) => setTargetTier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">目標日付</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '設定中...' : editingGoal ? '更新' : '目標を設定'}
          </button>
          {editingGoal && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
