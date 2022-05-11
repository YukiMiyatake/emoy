const { getDynamoDBClient } = require("../utils");
//var AWS = require("aws-sdk");
//AWS.config.update({ region: process.env.AWS_REGION });

const ddb = getDynamoDBClient();

exports.handler = function (event, context, callback) {
  var deleteParams = {
    TableName: process.env.TABLE_NAME,
    Key: {
      connectionId: { S: event.requestContext.connectionId }
    }
  };
console.log("delete  " + event.requestContext.connectionId)
  ddb.deleteItem(deleteParams, function (err) {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? "Failed to disconnect: " + JSON.stringify(err) : "Disconnected."
    });
  });
};
