type Player = {
    PlayerID: string;
    Name: string;
    RatingMu: number;
    RatingSigma: number;
  };
  
  // 合計レートが近い2チームに分割する関数
  export const divideIntoBalancedTeams = (players: Player[]): [Player[], Player[]] => {
    if (players.length !== 10) {
      throw new Error("プレイヤー数は10人である必要があります。");
    }
  
    // プレイヤーをすべての組み合わせで分割
    const combinations = generateCombinations(players, 5);
    let bestTeam1: Player[] = [];
    let bestTeam2: Player[] = [];
    let smallestDifference = Infinity;
  
    combinations.forEach((team1) => {
      const team2 = players.filter((player) => !team1.includes(player));
  
      const team1MuSum = team1.reduce((sum, player) => sum + player.RatingMu, 0);
      const team2MuSum = team2.reduce((sum, player) => sum + player.RatingMu, 0);
  
      const difference = Math.abs(team1MuSum - team2MuSum);
  
      if (difference < smallestDifference) {
        smallestDifference = difference;
        bestTeam1 = team1;
        bestTeam2 = team2;
      }
    });
  
    return [bestTeam1, bestTeam2];
  };
  
  // チームの組み合わせを生成する関数
  const generateCombinations = (players: Player[], teamSize: number): Player[][] => {
    const result: Player[][] = [];
    const combine = (arr: Player[], data: Player[], start: number, end: number, index: number, r: number) => {
      if (index === r) {
        result.push([...data]);
        return;
      }
  
      for (let i = start; i <= end && end - i + 1 >= r - index; i++) {
        data[index] = arr[i];
        combine(arr, data, i + 1, end, index + 1, r);
      }
    };
  
    combine(players, new Array(teamSize), 0, players.length - 1, 0, teamSize);
    return result;
  };

