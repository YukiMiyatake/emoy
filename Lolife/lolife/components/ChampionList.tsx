/* eslint @typescript-eslint/no-explicit-any: 0 */

'use client';

import { useEffect, useState } from 'react';
import ChampionCard from './ChampionCard';

export default function ChampionList({ champions }: { champions: any[] }) {
  const [storedChampions, setStoredChampions] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: string | boolean }>({});
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);

  const handleDialogToggle = (id: string | null) => {
    setOpenDialogId(id); // 現在開いているダイアログのIDを設定
  };

  useEffect(() => {
    const savedChampions = localStorage.getItem('champions');
    if (savedChampions) {
      const localChampions = JSON.parse(savedChampions);

      // マージ処理: APIから取得したチャンピオンとローカルのチャンピオンを比較
      const localChampionIds = new Set(localChampions.map((champion: any) => champion.id));
      const newChampions = champions.filter((champion: any) => !localChampionIds.has(champion.id));
      const mergedChampions = [...localChampions, ...newChampions];

      // 名前でソート
      const sortedChampions = mergedChampions.sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      );

      setStoredChampions(sortedChampions);

      // マージ後のデータをlocalStorageに保存
      localStorage.setItem('champions', JSON.stringify(sortedChampions));
    } else {
      // 名前でソート
      const sortedChampions = champions.sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      );

      setStoredChampions(sortedChampions);
      localStorage.setItem('champions', JSON.stringify(sortedChampions));
    }
  }, [champions]);

  const toggleFilter = (tag: string) => {
    setFilters((prev) => {
      if (tag === 'Live') {
        // Liveフィルターの状態を切り替える
        const currentState = prev.Live;
        if (currentState === 'True') return { ...prev, Live: 'False' }; // True -> False
        if (currentState === 'False') return { ...prev, Live: 'Both' }; // False -> Both
        return { ...prev, Live: 'True' }; // Both -> True
      }
      // 他のフィルターは通常のトグル
      return prev[tag]
        ? { ...prev, [tag]: false }
        : { ...prev, [tag]: true };
    });
    setOpenDialogId(null); // フィルターボタンを押したときにダイアログを閉じる
  };

  const filteredChampions = storedChampions.filter((champion) => {
    // Liveフィルターの処理
    if (filters.Live) {
      if (filters.Live === 'True' && !champion.tags.Live) return false;
      if (filters.Live === 'False' && champion.tags.Live) return false;
    }

    // Top, Jg, Mid, Bot, Supのフィルター処理 (or条件)
    const roleFilters = ['Top', 'Jg', 'Mid', 'Bot', 'Sup'];
    const activeRoleFilters = roleFilters.filter((role) => filters[role]);
    if (activeRoleFilters.length > 0) {
      // いずれかのフィルターが有効で、チャンピオンがそのタグを持たない場合は除外
      if (!activeRoleFilters.some((role) => champion.tags[role])) {
        return false;
      }
    }

    return true; // フィルター条件をすべて満たす場合
  });

  return (
    <div>
      <div>
        {['Live', 'Top', 'Jg', 'Mid', 'Bot', 'Sup'].map((tag) => (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            style={{
              backgroundColor:
                tag === 'Live'
                  ? filters.Live === 'True'
                    ? '#4CAF50'
                    : filters.Live === 'False'
                    ? '#FF5722'
                    : '#f0f0f0'
                  : filters[tag]
                  ? '#4CAF50'
                  : '#f0f0f0', // トグル状態に応じて色を変更
              color:
                tag === 'Live'
                  ? filters.Live === 'True'
                    ? 'white'
                    : filters.Live === 'False'
                    ? 'white'
                    : 'black'
                  : filters[tag]
                  ? 'white'
                  : 'black', // トグル状態に応じて色を変更
              border: '1px solid #ccc',
              padding: '5px 10px',
              margin: '5px',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {tag !== 'Live' ? tag + ' ' : ''}
            {tag === 'Live'
              ? filters.Live === 'True'
                ? 'Live'
                : filters.Live === 'False'
                ? 'Death'
                : 'Champion'
              : filters[tag]
              ? '✓'
              : ''}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {filteredChampions.map((champion) => (
          <ChampionCard
            key={champion.id}
            champion={champion}
            onUpdate={(updatedChampion) => {
              const updatedChampions = storedChampions.map((c) =>
                c.id === updatedChampion.id ? updatedChampion : c
              );
              setStoredChampions(updatedChampions);
              localStorage.setItem('champions', JSON.stringify(updatedChampions));
            }}
            isOpen={openDialogId === champion.id} // ダイアログが開いているかどうかを判定
            onToggleDialog={() =>
              handleDialogToggle(openDialogId === champion.id ? null : champion.id)
            }
          />
        ))}
      </div>
    </div>
  );
}