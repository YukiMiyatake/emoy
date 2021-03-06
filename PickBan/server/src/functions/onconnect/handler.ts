import { APIGatewayHandler, formatJSONResponse, formatStringResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
//import schema from './schema';
import {getDynamoDBClient} from '@libs/utils';
import {createConnectionById, checkAdminLogin} from '@libs/db';

console.log("aaa")


//const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async event => {
const onconnect: APIGatewayHandler = async event => {
  const { connectionId } = event.requestContext;
  const { admin="", appname="", password="" } = event.queryStringParameters;

  console.log("getDynamoDBClient") 
  const ddb = getDynamoDBClient();
  try {
    const isAdmin = checkAdminLogin(ddb, admin, appname, password);

    console.log("createConnectionById") 
    await createConnectionById(ddb, connectionId);
  } catch (err) {
    console.error(err)
    return formatStringResponse(400, 'Failed to connect  ' +  err.message);
  }

  return formatStringResponse(200, 'Connected.');
};

export const main = middyfy(onconnect);
