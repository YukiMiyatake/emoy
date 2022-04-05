var AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
//AWS.config.update({ region: 'localhost' });
var DDB = new AWS.DynamoDB({ apiVersion: "2012-10-08" });

/*
var DDB = process.env.IS_OFFLINE
? new DynamoDB({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    apiVersion: "2012-10-08",
    accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
    secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
  })
  : new DynamoDB({ apiVersion: "2012-10-08" });
*/
console.log("is offline   " + process.env.IS_OFFLINE)

exports.handler = function (event, context, callback) {
  var putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: { S: event.requestContext.connectionId }
    }
  };
  console.log(putParams);
  DDB.putItem(putParams, function (err) {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? "Failed to connect: " + JSON.stringify(err) : "Connected."
    });
  });
};
