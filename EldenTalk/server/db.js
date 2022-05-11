const { TABLE_NAME } = process.env;


async function findConnectionById(ddb, connectionId) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        connectionId: connectionId
      }
    };
    return (await ddb.get(params).promise()).Item;
  }