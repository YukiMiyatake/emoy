
const { getApiGatewayManagementApi, getDynamoDBClient } = require("../utils");
const { TABLE_NAME } = process.env;

const ddb = getDynamoDBClient();


exports.handler = async (event, context) => {
  let connectionData;

  const sender = await findConnectionById(ddb, connectionId);
  if (sender.userId === undefined) {
    return { statusCode: 400, body: 'State error.' };
  }

  console.log("send  " +  event.requestContext.connectionId)
  //AWS.config.update({ region: 'localhost' });
console.log(event.requestContext.domainName + '/' + event.requestContext.stage)

const {connectionId, apiId, stage} = event.requestContext;
const apigwManagementApi = getApiGatewayManagementApi(domainName, stage);


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
