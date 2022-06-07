import type { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayEventRequestContext, Handler } from "aws-lambda"
//import type { FromSchema } from "json-schema-to-ts";

interface APIGatewayProxyEventWithWebSocket extends APIGatewayProxyEvent {
  requestContext: APIGatewayEventRequestContextWithWebSocket
}
interface APIGatewayEventRequestContextWithWebSocket extends APIGatewayEventRequestContext {
  domainName: string,
  connectionId: string
}
//type ValidatedAPIGatewayProxyEventWithWebSocket<S> = Omit<APIGatewayProxyEventWithWebSocket, 'requestContext' | 'queryStringParameters'> & FromSchema<S> 
//export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<ValidatedAPIGatewayProxyEventWithWebSocket<S>, APIGatewayProxyResult>

export type APIGatewayHandler = Handler<APIGatewayProxyEventWithWebSocket, APIGatewayProxyResult>
export const formatJSONResponse = (statusCode: number, response: Record<string, unknown>) => {
  return formatStringResponse(statusCode, JSON.stringify(response))
}

export const formatStringResponse = (statusCode: number, response: string) => {
  return {
    statusCode: statusCode,
    body: response
  }
}

