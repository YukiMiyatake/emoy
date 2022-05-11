console.log("onconnect")
const { getDynamoDBClient } = require("../utils");

//var AWS = require("aws-sdk");
//AWS.config.update({ region: process.env.AWS_REGION });
//AWS.config.update({ region: "localhost" });


const ddb = getDynamoDBClient();

exports.handler = function (event, context, callback) {
  var putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: { S: event.requestContext.connectionId }
    }
  };
  console.log(putParams);
  ddb.putItem(putParams, function (err) {
    if(err){
      console.log("put error   " + err.message)
    }

    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? "Failed to connect: " + JSON.stringify(err) : "Connected."
    });
  });
};
