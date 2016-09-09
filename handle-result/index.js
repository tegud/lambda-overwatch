'use strict';

const AWS = require("aws-sdk");
const snsFailureTopicArn = "%FAILURE_SNS_TOPIC_ARN%";
const snsCompleteTopicArn = "%COMPLETE_SNS_TOPIC_ARN%";

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

exports.handler = function (event, context, callback) {
    const result = JSON.parse(event.Records[0].Sns.Message);

    // TODO: SAVE TO S3

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
