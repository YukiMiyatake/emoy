/*
  例えば配信用に、どのチャンプを使ったかの一覧
*/
// クリック部分だけクライアントにしたい



import { useEffect } from 'react';
import { getServerSideProps, ChampionListProps, ChampionProps } from './no-store/champions';
import { ChampionDiv } from '@/components/client';

// TODO: LatestのバージョンをAPIで取得し、WebStorageのバージョンと比較
// バージョンが変わっていたら チャンピオン取得APIを呼び、WebStorageにチャンピオン名（英語、日本語）取得

// 毎回チャンピオンAPIを使わず、WebStorageからチャンピオン名リストを読むようにする
// WebStorageには Version、[champion.key, champion.image.full, champion.name,  フラグ（後述）  ]
// マウスクリックで、フラグを変更し、フラグに応じてオーバーレイ（〇、× あるいは暗転など）
// チャンピオン選定も可能にする（Midチャンプなど）

/*
  WebStorage案

  Version
  Main
    id
    name
    image
    status

  

*/

const LOL_VERSION = '14.13.1';


type Props = {champions: any}






function ChampionsPage( {champions}: ChampionListProps ) {

// ComponentにわけてClinetServerわける
  //const [state, setState] = useState(champions);

  return (
    <div>
      {champions.map((champion, index) => (
        <><a /><ChampionDiv champion={champion} /></>

/*
      

        <div
          //onClick={() => (() =>{champion.status = 1})()}  
          key={champion.id} style={{ position: 'relative', display: 'inline-block'}}>
          




          <img 
            src={`http://ddragon.leagueoflegends.com/cdn/${LOL_VERSION}/img/champion/${champion.image}`}
            alt={champion.name} 
            
          />
          
          {
            (() =>{
              if (champion.status == 1) {
                return (
                  <img
                    src={"maru.png"}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  />
                );
            }


          })()
        }
        </div>
*/

      ))}
    
    </div>

  );
}

//export default ChampionsPage;


export default async function Home() {
  let champions = await getServerSideProps();
/*
  // LocalStorageからChampionPropsデータを取得する
  // データが無い場合はgetServerSideProps()で取得する
  

  const getChampionPropsFromLocalStorage = () : ChampionListProps | null  =>{
    const storedData = localStorage.getItem('championProps');
    return storedData ? JSON.parse(storedData) : null;
  };

  let champions: ChampionListProps | null = getChampionPropsFromLocalStorage();
  if( !champions ) { champions = (await getServerSideProps()).props};

  localStorage.setItem('championProps', JSON.stringify(champions));

*/


 
  return (
    ChampionsPage(champions.props)
  );
}
