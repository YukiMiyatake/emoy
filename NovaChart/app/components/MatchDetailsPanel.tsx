'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Match } from '@/types';
import { rateMatch, getRatingColor, getRatingBgColor, MatchRatingResult } from '@/lib/analytics/matchRating';

export default function MatchDetailsPanel() {
  const { matches, loadMatches } = useAppStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchRatings, setMatchRatings] = useState<Map<number, MatchRatingResult>>(new Map());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    // 各試合の評価を計算
    const ratings = new Map<number, MatchRatingResult>();
    matches.forEach(match => {
      if (match.id !== undefined) {
        ratings.set(match.id, rateMatch(match, match.lane));
      }
    });
    setMatchRatings(ratings);
  }, [matches]);

  // 最近の試合を取得（最新20試合）
  const recentMatches = matches.slice(0, 20);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleDeleteAllMatches = async () => {
    if (!confirm('すべての試合詳細データを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { matchService } = await import('@/lib/db');
      await matchService.deleteAll();
      await loadMatches();
      alert('試合詳細データを削除しました');
    } catch (error) {
      console.error('Failed to delete matches:', error);
      alert('試合詳細データの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">試合詳細</h2>
        {matches.length > 0 && (
          <button
            onClick={handleDeleteAllMatches}
            disabled={isDeleting}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? '削除中...' : '試合データ削除'}
          </button>
        )}
      </div>

      {recentMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">試合データがありません</p>
          <p className="text-sm text-gray-400">サマナーを検索またはUpdateボタンでデータを取得してください</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
        {recentMatches.map((match) => {
          const rating = match.id !== undefined ? matchRatings.get(match.id) : null;
          const kda = match.kda;
          const kdaText = kda ? `${kda.kills}/${kda.deaths}/${kda.assists}` : '-';
          const kdaRatio = kda && kda.deaths > 0 
            ? ((kda.kills + kda.assists) / kda.deaths).toFixed(2)
            : kda && kda.deaths === 0
            ? 'Perfect'
            : '-';

          return (
            <div
              key={match.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                match.win
                  ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'
              } ${selectedMatch?.id === match.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedMatch(match)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-sm font-bold ${
                    match.win ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {match.win ? '勝利' : '敗北'}
                  </span>
                  {rating && (
                    <span className={`px-3 py-1 rounded font-bold text-lg ${getRatingBgColor(rating.rating)} ${getRatingColor(rating.rating)}`}>
                      {rating.rating}
                    </span>
                  )}
                  <span className="font-semibold">{match.champion || '-'}</span>
                  {match.lane && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {match.lane}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(match.date)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">KDA: </span>
                  <span className="font-semibold">{kdaText}</span>
                  <span className="text-gray-500 ml-1">({kdaRatio})</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">CS/分: </span>
                  <span className="font-semibold">{match.csPerMin?.toFixed(1) || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ダメージ: </span>
                  <span className="font-semibold">
                    {match.damageToChampions ? Math.round(match.damageToChampions).toLocaleString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">時間: </span>
                  <span className="font-semibold">{formatDuration(match.gameDuration)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMatch && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">試合詳細情報</h3>
          
          {(() => {
            const rating = selectedMatch.id !== undefined ? matchRatings.get(selectedMatch.id) : null;
            return (
              <div className="space-y-4">
                {rating && (
                  <div>
                    <h4 className="font-semibold mb-2">パフォーマンス評価</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-4 py-2 rounded text-2xl font-bold ${getRatingBgColor(rating.rating)} ${getRatingColor(rating.rating)}`}>
                        {rating.rating}
                      </span>
                      <span className="text-lg">総合スコア: {rating.score}/100</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">KDA: </span>
                        <span>{Math.round(rating.breakdown.kdaScore)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">CS: </span>
                        <span>{Math.round(rating.breakdown.csScore)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">ダメージ: </span>
                        <span>{Math.round(rating.breakdown.damageScore)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">ビジョン: </span>
                        <span>{Math.round(rating.breakdown.visionScore)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">参加率: </span>
                        <span>{Math.round(rating.breakdown.participationScore)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">基本情報</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">チャンピオン: </span>
                        <span className="font-semibold">{selectedMatch.champion || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">レーン: </span>
                        <span className="font-semibold">{selectedMatch.lane || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">試合時間: </span>
                        <span className="font-semibold">{formatDuration(selectedMatch.gameDuration)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">日時: </span>
                        <span className="font-semibold">{formatDate(selectedMatch.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">戦績</h4>
                    <div className="space-y-1 text-sm">
                      {selectedMatch.kda && (
                        <>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">キル: </span>
                            <span className="font-semibold">{selectedMatch.kda.kills}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">デス: </span>
                            <span className="font-semibold">{selectedMatch.kda.deaths}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">アシスト: </span>
                            <span className="font-semibold">{selectedMatch.kda.assists}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">KDA: </span>
                            <span className="font-semibold">
                              {selectedMatch.kda.deaths > 0
                                ? ((selectedMatch.kda.kills + selectedMatch.kda.assists) / selectedMatch.kda.deaths).toFixed(2)
                                : 'Perfect'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">キル参加率: </span>
                            <span className="font-semibold">
                              {selectedMatch.killParticipation ? `${selectedMatch.killParticipation.toFixed(1)}%` : '-'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">統計</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">CS/分: </span>
                        <span className="font-semibold">{selectedMatch.csPerMin?.toFixed(1) || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">10分時点CS: </span>
                        <span className="font-semibold">{selectedMatch.csAt10 || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">総CS: </span>
                        <span className="font-semibold">
                          {selectedMatch.totalMinionsKilled && selectedMatch.neutralMinionsKilled
                            ? (selectedMatch.totalMinionsKilled + selectedMatch.neutralMinionsKilled)
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">ビジョンスコア: </span>
                        <span className="font-semibold">{selectedMatch.visionScore || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">ダメージ</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">チャンピオンへのダメージ: </span>
                        <span className="font-semibold">
                          {selectedMatch.damageToChampions ? Math.round(selectedMatch.damageToChampions).toLocaleString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">受けたダメージ: </span>
                        <span className="font-semibold">
                          {selectedMatch.damageTaken ? Math.round(selectedMatch.damageTaken).toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">経済</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">獲得ゴールド: </span>
                        <span className="font-semibold">
                          {selectedMatch.goldEarned ? Math.round(selectedMatch.goldEarned).toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMatch.memo && (
                  <div>
                    <h4 className="font-semibold mb-2">メモ</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedMatch.memo}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
        </>
      )}
    </div>
  );
}

