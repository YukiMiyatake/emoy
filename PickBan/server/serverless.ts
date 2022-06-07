import type { AWS } from '@serverless/typescript';

import onconnect from '@functions/onconnect';
//import ondisconnect from '@functions/ondisconnect';
//import sendmessage from '@functions/sendmessage';

const serverlessConfiguration: AWS = {
  service: 'emoy-waitinglist',
  frameworkVersion: '3',
  app: 'emoy-waitinglist',
  plugins: ['serverless-esbuild', 'serverless-dynamodb-local', 'serverless-offline'],
  custom: {
    manageTableName: 'emoy-manage-${sls:stage}',
    connectionTableName: '${self:service}-connection-${sls:stage}',
    logTableName: '${self:service}-log-${sls:stage}',
    defaultStage: 'dev',
    environment: {
//      dev: '${file(./env/dev.yml)}',
//      stg: '${file(./env/stg.yml)}',
//      prod: '${file(./env/prod.yml)}',
    },
    dynamodb: {
      stages: ['dev'],
      start:{
        migrate: true
      },
    },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
  provider: {
    name: 'aws',
    stage: '${opt:stage, self:custom.defaultStage}',
    runtime: 'nodejs14.x',
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action:[
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
        ],
        Resource:[
          {'Fn::Sub': "${ManageTable.Arn}"},
          {'Fn::Sub': "${ConnectionTable.Arn}"},
          {'Fn::Sub': "${LogTable.Arn}"},
        ],
      },
      {
        Effect: 'Allow',
        Action:[
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        Resource:[
          {'Fn::Sub': "${ManageTable.Arn}/index/"},
          {'Fn::Sub': "${ConnectionTable.Arn}/index/"},
          {'Fn::Sub': "${LogTable.Arn}/index/"},
        ],
      },
    ],

    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    websocketsApiName: '${self:service}',
    websocketsApiRouteSelectionExpression: '$request.body.action',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      MANAGE_TABLE_NAME: '${self:custom.manageTableName}',
      CONNECTION_TABLE_NAME: '${self:custom.connectionTableName}',
      LOG_TABLE_NAME: '${self:custom.logTableName}',
    },
  },
  resources: {
    Resources: {
      ManageTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName:  '${self:custom.manageTableName}',
          AttributeDefinitions: [
            {
              AttributeName: 'admin',
              AttributeType: 'S',
            },
            {
              AttributeName: 'appname',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'admin',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'appname',
              KeyType: 'RANGE',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          SSESpecification: {
            SSEEnabled: true
          },
        },
      },
      ConnectionTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName:  '${self:custom.connectionTableName}',
          AttributeDefinitions: [
            {
              AttributeName: 'admin',
              AttributeType: 'S',
            },
            {
              AttributeName: 'username',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'admin',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'username',
              KeyType: 'RANGE',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          SSESpecification: {
            SSEEnabled: true
          },
        },
      },
      LogTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName:  '${self:custom.logTableName}',
          AttributeDefinitions: [
            {
              AttributeName: 'admin',
              AttributeType: 'S',
            },
            {
              AttributeName: 'createdAt',
              AttributeType: 'N',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'admin',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'createdAt',
              KeyType: 'RANGE',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          SSESpecification: {
            SSEEnabled: true
          },
        },
      },    
    },
  },

  // import the function via paths
  functions: { onconnect },
//  functions: [ onconnect, ondisconnect, sendmessage ],
  package: { individually: true },
};

module.exports = serverlessConfiguration;
