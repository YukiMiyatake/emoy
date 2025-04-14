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
      setStoredChampions(JSON.parse(savedChampions));
    } else {
      setStoredChampions(champions);
      localStorage.setItem('champions', JSON.stringify(champions));
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
    // 他のフィルターの処理
    return Object.keys(filters).every(
      (filter) =>
        filter === 'Live' || // Liveは特別処理済み
        filters[filter] === false || // フィルターが無効ならスキップ
        champion.tags[filter]
    );
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
                tag === 'Live' && filters.Live === 'Both'
                  ? 'black'
                  : filters[tag] || filters.Live === 'True' || filters.Live === 'False'
                  ? 'white'
                  : 'black', // テキスト色も変更
              border: '1px solid #ccc',
              padding: '5px 10px',
              margin: '5px',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {tag}{' '}
            {tag === 'Live'
              ? filters.Live === 'True'
                ? '✓ True'
                : filters.Live === 'False'
                ? '✓ False'
                : '✓ Both'
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