/* eslint @typescript-eslint/no-explicit-any: 0 */

'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import ChampionCard from './ChampionCard';

export default function ChampionList({ champions }: { champions: any[] }) {
  const [storedChampions, setStoredChampions] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: string | boolean }>({});
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [randomCount, setRandomCount] = useState<number>(5); // ランダム選択数

  const handleDialogToggle = (id: string | null) => {
    setOpenDialogId(id);
  };

  useEffect(() => {
    const savedChampions = localStorage.getItem('champions');
    if (savedChampions) {
      const localChampions = JSON.parse(savedChampions);
      const localChampionIds = new Set(localChampions.map((champion: any) => champion.id));
      const newChampions = champions.filter((champion: any) => !localChampionIds.has(champion.id));
      const mergedChampions = [...localChampions, ...newChampions];
      const sortedChampions = mergedChampions.sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      );
      setStoredChampions(sortedChampions);
      localStorage.setItem('champions', JSON.stringify(sortedChampions));
    } else {
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
        const currentState = prev.Live;
        if (currentState === 'True') return { ...prev, Live: 'False' };
        if (currentState === 'False') return { ...prev, Live: 'Both' };
        return { ...prev, Live: 'True' };
      }
      return prev[tag]
        ? { ...prev, [tag]: false }
        : { ...prev, [tag]: true };
    });
    setOpenDialogId(null);
  };

  const setRandomChoiced = () => {
    if (!window.confirm(`${randomCount}個のチャンピオンをランダムでChoiceに設定しますか？`)) {
      return;
    }

    const updatedChampions = storedChampions.map((champion) => ({
      ...champion,
      tags: { ...champion.tags, Choiced: false },
    }));

    const randomIndexes = Array.from({ length: randomCount }, () =>
      Math.floor(Math.random() * updatedChampions.length)
    );

    randomIndexes.forEach((index) => {
      updatedChampions[index].tags.Choiced = true;
    });

    setStoredChampions(updatedChampions);
    localStorage.setItem('champions', JSON.stringify(updatedChampions));
  };

  const filteredChampions = storedChampions.filter((champion) => {
    if (filters.Live) {
      if (filters.Live === 'True' && !champion.tags.Live) return false;
      if (filters.Live === 'False' && champion.tags.Live) return false;
    }

    const roleFilters = ['Top', 'Jg', 'Mid', 'Bot', 'Sup'];
    const activeRoleFilters = roleFilters.filter((role) => filters[role]);
    if (activeRoleFilters.length > 0) {
      if (!activeRoleFilters.some((role) => champion.tags[role])) {
        return false;
      }
    }

    // Choiced の AND 条件
    if (filters.Choiced && !champion.tags.Choiced) {
      return false;
    }

    return true;
  });

  return (
    <div>
      <div>
        {['Live', 'Top', 'Jg', 'Mid', 'Bot', 'Sup', 'Choiced'].map((tag) => (
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
                  : '#f0f0f0',
              color:
                tag === 'Live'
                  ? filters.Live === 'True'
                    ? 'white'
                    : filters.Live === 'False'
                    ? 'white'
                    : 'black'
                  : filters[tag]
                  ? 'white'
                  : 'black',
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
      <div style={{ margin: '10px 0' }}>
        <input
          type="number"
          value={randomCount}
          onChange={(e) => setRandomCount(Number(e.target.value))}
          style={{ marginRight: '10px', padding: '5px', width: '50px' }}
        />
        <button
          onClick={setRandomChoiced}
          style={{
            padding: '5px 10px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          ランダムChoice
        </button>
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
            isOpen={openDialogId === champion.id}
            onToggleDialog={() =>
              handleDialogToggle(openDialogId === champion.id ? null : champion.id)
            }
          />
        ))}
      </div>
    </div>
  );
}