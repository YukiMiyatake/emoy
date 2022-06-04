import { DynamoDBClient, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";

  import { GetCommand, GetCommandInput, ScanCommand, ScanCommandInput, 
    PutCommand, PutCommandInput, DeleteCommandInput, DeleteCommand } from "@aws-sdk/lib-dynamodb";
  
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const { MANAGE_TABLE_NAME
  , CONNECTION_TABLE_NAME
  , LOG_TABLE_NAME 
} = process.env;

// APIの引数や戻り値をTypeしたい
export async function createAdmin(ddb: DynamoDBClient, admin: string, appname: string, password: string) {
  const params: PutCommandInput = {
    TableName: CONNECTION_TABLE_NAME,
    Item: {
      admin: admin,
      appname: appname,
      password: password 
    }
  };

  console.log("put: " + JSON.stringify(params))
  const item = await ddb.send( new PutCommand(params));
  return item;
}

export async function checkAdminLogin(ddb: DynamoDBClient, admin: string, appname: string, password: string) {
  if(admin==="") return false;

  const params: QueryCommandInput = {
    TableName: MANAGE_TABLE_NAME,
    KeyConditionExpression: "#admin= :admin_val AND #appname  = :appname_val",
    ExpressionAttributeNames:{
        "#admin":       "admin",
        "#appname":     "appname"
    },
    ExpressionAttributeValues: {
        ":admin_val":   { S: admin },
        ":appname_val": { S: appname }
    }
  };
  return ((await ddb.send( new QueryCommand(params))).Items["password"] === password);
}




export async function createConnectionById(ddb: DynamoDBClient, connectionId: string, isAdmin: boolean) {
  console.log("createConnectionById[" + CONNECTION_TABLE_NAME + "]")

  const params: PutCommandInput = {
    TableName: CONNECTION_TABLE_NAME,
    Item: {
      connectionId: connectionId,
      isAdmin: isAdmin 
    }
  };

  console.log("put: " + JSON.stringify(params))
  const item = await ddb.send( new PutCommand(params));
  return item;
}

export async function findConnectionById(ddb: DynamoDBClient, connectionId: string) {
  const params: GetCommandInput = {
    TableName: CONNECTION_TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  return (await ddb.send(new GetCommand(params))).Item;
}

export async function deleteConnectionById(ddb: DynamoDBClient, connectionId: string) {
  const params: DeleteCommandInput = {
    TableName: CONNECTION_TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };
  return(await ddb.send(new DeleteCommand(params)));
}

export async function scanConnections(ddb: DynamoDBClient) {
  const params: ScanCommandInput = {
    TableName: CONNECTION_TABLE_NAME,
    ProjectionExpression: 'connectionId'
  };

    return await ddb.send(new ScanCommand(params));
}
  
