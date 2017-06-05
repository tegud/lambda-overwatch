const AWS = require("aws-sdk");

function sendSnsEvent(topicArn, subject, message) {
    return new Promise((resolve, reject) => {
        const sns = new AWS.SNS();

        sns.publish({
            Message: JSON.stringify(message),
            Subject: subject,
            TopicArn: topicArn
        }, err => {
            if(err) {
                reject(`Failed to send SNS ${err}`);
            }

            resolve();
        });
    });
}

module.exports.handleRequest = (event, context, callback) => {
    const result = JSON.parse(event.Records[0].Sns.Message);
    const snsFailureTopicArn = process.env.failureSnsTopic;
    const snsCompleteTopicArn = process.env.completeSnsTopic;

    sendSnsEvent(snsCompleteTopicArn, `SITE RESULT: ${result.url}`, result)
      .then(() => {
          if(result.success) {
              console.log('Site monitor ok, nothing to do');
              return new Promise(resolve => resolve());
          }

          console.log('Site monitor fail, sending to failure SNS');
          return sendSnsEvent(snsFailureTopicArn, `SITE FAIL: ${result.url}`, result.errorMessage || result);
      })
      .then(() => callback())
      .catch(callback);
};
