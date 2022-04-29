const AWS = require('aws-sdk');

//AWS.config.update({ region: process.env.AWS_REGION });
const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const { TABLE_NAME } = process.env;

exports.handler = async (event, context) => {
  let connectionData;


  try {
    connectionData = await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }
  console.log("send  " +  event.requestContext.connectionId)
  //AWS.config.update({ region: 'localhost' });
console.log(event.requestContext.domainName + '/' + event.requestContext.stage)

const {connectionId, apiId, stage} = event.requestContext;

var endpoint =  process.env.IS_OFFLINE
    ? 'http://localhost:3001'
    : `https://${apiId}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${stage}`;

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: endpoint
  });

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