console.log("onconnect")
const { getDynamoDBClient } = require("../utils");
const { createConnectionById } = require("../db");

const ddb = getDynamoDBClient();

exports.handler =  async event  => {
  const { connectionId } = event.requestContext;

  try {
    await createConnectionById(ddb, connectionId);
  } catch (err) {
    console.error(err)
    return { statusCode: 400, body: 'Failed to connect  ' +  err.message };
  }


  return { statusCode: 200, body: 'Connected.' };

};
