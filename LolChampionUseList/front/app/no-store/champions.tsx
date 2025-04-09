import axios from 'axios';


const LOL_VERSION = '14.13.1';


export type ChampionData = 
{
  id: number
  name: string
  image: string
  status: number
  display: boolean
}

export type ChampionProps = {
  champion: ChampionData
}

export type ChampionListProps = {
  champions: ChampionData[]
  index?: number; 
  //children?: React.ReactNode
}

export type ChampionIndexProps = {
//  champion: ChampionData,
  index: number
}

async function getChampions() {

  const url = `https://ddragon.leagueoflegends.com/cdn/${LOL_VERSION}/data/ja_JP/champion.json`;

  try {
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getServerSideProps() {
  const champions = await getChampions();


  // championsよりChampionPropsにデータをコピーする
  const championsProps: ChampionListProps = {
    champions: Object.values(champions).map((champion: any) => {
      return {
        id: champion.key,
        name: champion.name,
        image: champion.image.full,
        status: 0,
        display: true,
      };
    }),
  };

//console.log(championsProps)

  return {
    props: championsProps,
  };
  
}