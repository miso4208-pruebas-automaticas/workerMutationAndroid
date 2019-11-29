var AWS = require('aws-sdk');
var andrMutationService = require('../app/services/andrMutation.srv.js');
AWS.config.getCredentials;
AWS.config.update({region:'us-east-1'});
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const sqsUrl = 'https://sqs.us-east-1.amazonaws.com/669213563582/worker-andrMutation-queue.fifo';

module.exports.getSqs = function(req,success,error){
    console.log("sqs andrMutation.,,,")
    var params = {
      AttributeNames: [
        'SentTimestamp'
      ],
      MaxNumberOfMessages: 1,
      MessageAttributeNames: [
        'All'
      ],
      QueueUrl: sqsUrl,
      VisibilityTimeout: 40,
      WaitTimeSeconds: 20
    };

    sqs.receiveMessage(params, function(err, data) {
      if (err) {
        console.log('Error', err);
      } else if (data.Messages) {
          console.log(data.Messages[0])
        let payload = JSON.parse(data.Messages[0].Body);
        console.log("Valor del payload: ", payload);
        executeService(payload,() => {
            console.log('ok test');
            sqsComplete(data.Messages[0].ReceiptHandle,payload.code);
            console.log("Proceso completo test");
          },
          (msg) =>{
            console.log('error test: ',msg);
          });

      }
    });

  };

  executeService = (req, success,error)=>{
    andrMutationService.generateAndrMutation(req, function(apps){
        success({ status: "OK" });
    },function(err){
        error(err);

    })
  }

  updateBD = (code)=>{
    let update = `UPDATE hangover.EXECUTION_TESTS SET status=1 WHERE code=${code}`;
    console.log(update);
    db.query(update, (err, result) => {
        if (err) throw error;
       console.log(result);
    });
  }

  const sqsComplete = (handle,code) => {
    var deleteParams = {
      QueueUrl: sqsUrl,
      ReceiptHandle: handle
    };
    sqs.deleteMessage(deleteParams, function(err, data) {
      if (err) {
        console.log('Delete Error', err);
      } else {
        updateBD(code);
        console.log('Message Deleted', data);
      }
    });
  };
