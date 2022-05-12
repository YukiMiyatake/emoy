const AWS = require('aws-sdk');

function getDynamoDBClient() {
  const ddbOpt = process.env.IS_OFFLINE ?
    {
      region: "localhost",
      endpoint: "http://localhost:8000",
      apiVersion: "2012-10-08"
    } :
    {
      region: process.env.AWS_REGION
    }
  return new AWS.DynamoDB.DocumentClient(ddbOpt);
}

function getApiGatewayManagementApi(domainName, stage) {
  const endpoint =  process.env.IS_OFFLINE
    ? 'http://localhost:3001'
    : domainName + '/' + stage;

  return new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint
  });
}

module.exports = {
  getDynamoDBClient,
  getApiGatewayManagementApi,
}
