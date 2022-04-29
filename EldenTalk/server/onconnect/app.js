console.log("onconnect")

var AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
//AWS.config.update({ region: "localhost" });


//var DDB = new AWS.DynamoDB({ apiVersion: "2012-10-08" });


var DDB = process.env.IS_OFFLINE
? new AWS.DynamoDB({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    apiVersion: "2012-10-08"
//    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })
  : new AWS.DynamoDB({ apiVersion: "2012-10-08" });

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
    
    if(err){
      console.log("put error   " + err.message)
    }
    

    callback(null, {
      statusCode: err ? 500 : 200,
      body: err ? "Failed to connect: " + JSON.stringify(err) : "Connected."
    });
  });
};