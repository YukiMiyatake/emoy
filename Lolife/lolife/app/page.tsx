/* eslint @typescript-eslint/no-explicit-any: 0 */
import axios from 'axios';
import ChampionList from '../components/ChampionList';

const LOL_VERSION = '14.13.1';

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
  const url = `https://ddragon.leagueoflegends.com/cdn/${LOL_VERSION}/data/en_US/champion.json`;
  const response = await axios.get(url);
  return Object.values(response.data.data).map((champion: any) => ({
    id: champion.key,
    name: champion.name,
    image: champion.image.full,
    tags: { Live: true, Top: false, Jg: false, Mid: false, Bot: false, Sup: false },
  }));
}

export default async function Page() {
  const champions: Champion[] = await fetchChampions();
  return <ChampionList champions={champions} />;
}