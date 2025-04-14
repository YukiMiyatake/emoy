import axios from 'axios';
import ChampionList from '../components/ChampionList';

const LOL_VERSION = '14.13.1';

async function fetchChampions() {
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
  const champions = await fetchChampions();
  return <ChampionList champions={champions} />;
}