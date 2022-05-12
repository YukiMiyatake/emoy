console.log("OnDisconnect");
const { getDynamoDBClient } = require("../utils");
const { deleteConnectionById } = require("../db");

const ddb = getDynamoDBClient();

exports.handler = async event => {
  const { connectionId } = event.requestContext;

  try {
    await deleteConnectionById(ddb, connectionId);
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Disconnect error  ' + err.Message };
  }

  console.log("delete  " + event.requestContext.connectionId)
  return { statusCode: 200, body: 'Disconnected.' };

};
