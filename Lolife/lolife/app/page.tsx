/* eslint @typescript-eslint/no-explicit-any: 0 */
import axios from 'axios';
import { CHAMPION_URL } from '../constants';
import ChampionList from '../components/ChampionList';


// チャンピオンデータの型定義
type Champion = {
  id: string;
  name: string;
  image: string;
  tags: {
    Live: boolean;
    Top: boolean;
    Jg: boolean;
    Mid: boolean;
    Bot: boolean;
    Sup: boolean;
  };
};

async function fetchChampions(): Promise<Champion[]> {
  const url = `${CHAMPION_URL}`;
  const response = await axios.get(url);
  return Object.values(response.data.data).map((champion: any) => ({
    id: champion.key,
    name: champion.name,
    image: champion.image.full,
    tags: { Live: true, Top: false, Jg: false, Mid: false, Bot: false, Sup: false },
  }));
}

function mergeChampions(localChampions: Champion[], fetchedChampions: Champion[]): Champion[] {
  const localChampionIds = new Set(localChampions.map((champion) => champion.id));
  const newChampions = fetchedChampions.filter((champion) => !localChampionIds.has(champion.id));
  return [...localChampions, ...newChampions];
}

export default async function Page() {
  const fetchedChampions: Champion[] = await fetchChampions();
  // localStorageからデータを取得
  const savedChampions = typeof window !== 'undefined' ? localStorage.getItem('champions') : null;
  let champions: Champion[] = fetchedChampions;

console.log("fetchd:" + fetchedChampions[1].name);
console.log("saved:" + savedChampions);

  if (savedChampions) {
    const localChampions: Champion[] = JSON.parse(savedChampions);
    console.log("localChampion[1]" + localChampions[1].name);
    
    champions = mergeChampions(localChampions, fetchedChampions);
    console.log("mergeChampions[1]" + champions[1].name);

    // 更新されたデータをlocalStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('champions', JSON.stringify(champions));
    }
  } else {
    // 初回ロード時にlocalStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('champions', JSON.stringify(fetchedChampions));
    }
  }

  return <ChampionList champions={champions} />;
}