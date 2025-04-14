import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
});

// プレイヤー一覧を取得するLambdaハンドラー
export const fetchPlayersHandler = async (event) => {
  const params = {
    TableName: process.env.PLAYERS_TABLE_NAME || 'Players',
  };

  try {
    const result = await dynamoDB.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    console.error('Error fetching players:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching players' }),
    };
  }
};

// プレイヤーを追加するLambdaハンドラー
export const addPlayerHandler = async (event) => {
  const player = JSON.parse(event.body);

  const params = {
    TableName: process.env.PLAYERS_TABLE_NAME || 'Players',
    Item: player,
  };

  try {
    await dynamoDB.put(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Player added successfully' }),
    };
  } catch (error) {
    console.error('Error adding player:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error adding player' }),
    };
  }
};

// プレイヤーを削除するLambdaハンドラー
export const deletePlayerHandler = async (event) => {
  const { playerID } = JSON.parse(event.body);

  const params = {
    TableName: process.env.PLAYERS_TABLE_NAME || 'Players',
    Key: {
      PlayerID: playerID,
    },
  };

  try {
    await dynamoDB.delete(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Player deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting player:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error deleting player' }),
    };
  }
};

// プレイヤーを編集するLambdaハンドラー
export const updatePlayerHandler = async (event) => {
  const player = JSON.parse(event.body);

  const params = {
    TableName: process.env.PLAYERS_TABLE_NAME || 'Players',
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
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Player updated successfully' }),
    };
  } catch (error) {
    console.error('Error updating player:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error updating player' }),
    };
  }
};

// プレイヤーのレーティングを一括更新するLambdaハンドラー
export const updatePlayerRatingsHandler = async (event) => {
  const players = JSON.parse(event.body);

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
      [process.env.PLAYERS_TABLE_NAME || 'Players']: writeRequests,
    },
  };

  try {
    await dynamoDB.batchWrite(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Player ratings updated successfully' }),
    };
  } catch (error) {
    console.error('Error updating player ratings:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error updating player ratings' }),
    };
  }
};