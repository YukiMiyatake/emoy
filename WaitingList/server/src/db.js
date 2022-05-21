const { TABLE_NAME } = process.env;

async function createConnectionById(ddb, connectionId) {
  const item = {
    connectionId: connectionId
  }
  const params = {
    TableName: TABLE_NAME,
    Item: item
  };
  await ddb.put(params).promise();
  return item;
}

async function deleteConnectionById(ddb, connectionId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  await ddb.delete(params).promise();
}

async function findConnectionById(ddb, connectionId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  return (await ddb.get(params).promise()).Item;
}



async function scanConnections(ddb) {
    return await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  }
  


module.exports = {
  createConnectionById,
  deleteConnectionById,
  findConnectionById,
  scanConnections,
}
