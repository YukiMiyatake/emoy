const { MANAGE_TABLE_NAME
  , CONNECTION_TABLE_NAME
  , LOG_TABLE_NAME 
} = process.env;


async function checkAdminLogin(ddb, admin, appname, password) {
  const params = {
    TableName: MANAGE_TABLE_NAME,
    KeyConditionExpression: "#admin= :admin_val AND #appname  = :appname_val",
    ExpressionAttributeNames:{
        "#admin": "admin",
        "#appname": "appname"
    },
    ExpressionAttributeValues: {
        ":admin_val": admin,
        ":appname_val": 'appname'
    }
  };
  return ((await ddb.get(params).promise()).Item.password === password);
}

  



async function createConnectionById(ddb, connectionId) {
  const item = {
    connectionId: connectionId
  }
  const params = {
    TableName: CONNECTION_TABLE_NAME,
    Item: item
  };
  await ddb.put(params).promise();
  return item;
}

async function deleteConnectionById(ddb, connectionId) {
  const params = {
    TableName: CONNECTION_TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  await ddb.delete(params).promise();
}

async function findConnectionById(ddb, connectionId) {
  const params = {
    TableName: CONNECTION_TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  return (await ddb.get(params).promise()).Item;
}



async function scanConnections(ddb) {
    return await ddb.scan({ TableName: CONNECTION_TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  }
  


module.exports = {
  createConnectionById,
  deleteConnectionById,
  findConnectionById,
  scanConnections,
}
