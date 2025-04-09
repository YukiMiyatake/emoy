import { Rating, rate } from 'ts-trueskill';


export { Rating };

// プレイヤーの初期レーティングを生成する関数
export const createInitialRating = () => new Rating();

// レーティングを更新する関数
export const updateRatings = (teams: Rating[][]) => {
  return rate(teams);
};
