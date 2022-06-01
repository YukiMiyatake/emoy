import { DynamoDBClient, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const { MANAGE_TABLE_NAME
  , CONNECTION_TABLE_NAME
  , LOG_TABLE_NAME 
} = process.env;


export async function checkAdminLogin(ddb: DynamoDBClient, admin: string, appname: string, password: string) {
  const params: QueryCommandInput = {
    TableName: MANAGE_TABLE_NAME,
    KeyConditionExpression: "#admin= :admin_val AND #appname  = :appname_val",
    ExpressionAttributeNames:{
        "#admin": "admin",
        "#appname": "appname"
    },
    ExpressionAttributeValues: {
        ":admin_val": admin,
        ":appname_val": appname
    }
  };
  return ((await ddb.get(params).promise()).Item.password === password);
}

  



export async function createConnectionById(ddb, connectionId) {
  console.log("createConnectionById[" + CONNECTION_TABLE_NAME + "]")
  const item = {
    connectionId: connectionId
  }
  const params = {
    TableName: CONNECTION_TABLE_NAME,
    Item: item
  };

  console.log("put: " + JSON.stringify(params))
  await ddb.put(params).promise();
  return item;
}

export async function deleteConnectionById(ddb, connectionId) {
  const params = {
    TableName: CONNECTION_TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  await ddb.delete(params).promise();
}

export async function findConnectionById(ddb, connectionId) {
  const params = {
    TableName: CONNECTION_TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  return (await ddb.get(params).promise()).Item;
}



export async function scanConnections(ddb) {
    return await ddb.scan({ TableName: CONNECTION_TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
}
  
