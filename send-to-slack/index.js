'use strict';

const AWS = require("aws-sdk");
const snsSlackTopicArn = "%SLACK_SNS_TOPIC_ARN%";

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

    sendSnsEvent(snsSlackTopicArn, `SITE RESULT: ${result.url}`, json.stringify({
          "text": `Site check result: ${result.url} ${result.success ? 'was successful' : 'failed'}.`
      }))
      .then(() => callback())
      .catch(callback);
};
