
console.log("sendmessage")

const { findConnectionById } = require("../db");
const { getApiGatewayManagementApi, getDynamoDBClient } = require("../utils");
const { TABLE_NAME } = process.env;

const ddb = getDynamoDBClient();


exports.handler = async (event, context) => {
  const { apiId, stage } = event.requestContext;
  const apigwManagementApi = getApiGatewayManagementApi(apiId, stage);

  let connectionData;

  // 現状は全員にメッセージ送るからScanでいい
  try {
    connectionData = await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }
 
  const postData = JSON.parse(event.body).data;

  const postCalls = connectionData.Items.map(async ({ connectionId }) => {
    try {
        console.log({ ConnectionId: connectionId, Data: postData });
      await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
      } else {
          console.log(e)
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
