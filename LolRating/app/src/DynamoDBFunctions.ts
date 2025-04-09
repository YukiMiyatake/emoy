import AWS from 'aws-sdk';


console.log(process.env.REACT_APP_AWS_ACCESS_KEY_ID);

// DynamoDB設定
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
});



// DynamoDBクライアントを設定
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: 'ap-northeast-1', // 例: 'ap-northeast-1'
  endpoint: 'http://localhost:8000'
});





// プレイヤー一覧を取得する関数
export const fetchPlayers = async (): Promise<any[]> => {
  const params = {
    TableName: 'Players',
  };

  try {
    const result = await dynamoDB.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
};

// プレイヤーを追加する関数
export const addPlayer = async (player: { PlayerID: string; Name: string; RatingMu: number; RatingSigma: number }) => {
  const params = {
    TableName: 'Players',
    Item: player,
  };

  try {
    await dynamoDB.put(params).promise();
  } catch (error) {
    console.error('Error adding player:', error);
  }
};

// プレイヤーを削除する関数
export const deletePlayer = async (playerID: string) => {
  const params = {
    TableName: 'Players',
    Key: {
      PlayerID: playerID,
    },
  };

  try {
    await dynamoDB.delete(params).promise();
  } catch (error) {
    console.error('Error deleting player:', error);
  }
};

// プレイヤーを編集する関数
export const updatePlayer = async (player: { PlayerID: string; Name: string; RatingMu: number; RatingSigma: number }) => {
  const params = {
    TableName: 'Players',
    Key: {
      PlayerID: player.PlayerID,
    },
    UpdateExpression: 'set #Name = :Name, RatingMu = :RatingMu, RatingSigma = :RatingSigma',
    ExpressionAttributeNames: {
      '#Name': 'Name',
    },
    ExpressionAttributeValues: {
      ':Name': player.Name,
      ':RatingMu': player.RatingMu,
      ':RatingSigma': player.RatingSigma,
    },
  };

  try {
    await dynamoDB.update(params).promise();
  } catch (error) {
    console.error('Error updating player:', error);
  }
};

// プレイヤーのレーティングを一括更新する関数
export const updatePlayerRatings = async (players: { PlayerID: string; Name: string; RatingMu: number; RatingSigma: number }[]) => {
  const writeRequests = players.map((player) => ({
    PutRequest: {
      Item: {
        PlayerID: player.PlayerID,
        Name: player.Name,
        RatingMu: player.RatingMu,
        RatingSigma: player.RatingSigma,
      },
    },
  }));

  const params = {
    RequestItems: {
      Players: writeRequests,
    },
  };

  try {
    await dynamoDB.batchWrite(params).promise();
    console.log('Player ratings updated successfully');
  } catch (error) {
    console.error('Error updating player ratings:', error);
  }
};