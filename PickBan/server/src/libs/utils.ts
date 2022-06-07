import { DynamoDBClient, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
const AWS = require('aws-sdk');
import {DynamoDB} from "aws-sdk"
import type { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayEventRequestContext, Handler } from "aws-lambda"

export function getDynamoDBClient(): DynamoDBClient {
  const ddbOpt = process.env.IS_OFFLINE ?
    {
      region: "localhost",
      endpoint: "http://localhost:8000",
      apiVersion: "2012-10-08"
    } :
    {
      region: process.env.AWS_REGION
    }
  return new DynamoDB.DocumentClient(ddbOpt);
}

export function getApiGatewayManagementApi(domainName: string, stage: string) {
  const endpoint =  process.env.IS_OFFLINE
    ? 'http://localhost:3001'
    : domainName + '/' + stage;

  return new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint
  });
}

