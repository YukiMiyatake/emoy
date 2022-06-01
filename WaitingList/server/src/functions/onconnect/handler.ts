import type { APIGatewayHandler } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
//import schema from './schema';


//const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async event => {
const hello: APIGatewayHandler = async event => {
    return formatJSONResponse(
    200, {
    message: `Hello ${event.body.name}, welcome to the exciting Serverless world!`,
   
  });
};

export const main = middyfy(hello);
