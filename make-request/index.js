'use strict';

const AWS = require("aws-sdk");
const http = require('http');
const snsTopicArn = "%RESULT_SNS_TOPIC_ARN%";

function buildResult(url, response) {
    return {
        url: url,
        statusCode: response.statusCode,
        success: response.statusCode === 200,
        errorMessage: response.statusCode !== 200 ? `Error response code ${response.statusCode} from url: ${url}` : undefined
    };
}

function buildTimeoutResult(url, timeout) {
    return {
        url: url,
        timeout: timeout,
        errorMessage: `Timeout after ${timeout}ms from url: ${url}`
    };
}

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
    const url = event.url;
    const timeout = event.timeout || 3000;
    let hasTimedOut;

    console.log(`Testing url: ${url}`);

    if(!url) {
        console.log(JSON.stringify(event, null, 4));
    }

    const req = http.get(url, (res) => {
        if(hasTimedOut) {
            console.log('Timed out, but response has returned eventually, do nothing.');
            return;
        }

        const result = buildResult(url, res);

        sendSnsEvent(snsTopicArn, "site-monitor-result", result)
            .then(() => callback())
            .catch(err => callback(err));
    });

    req.setTimeout(timeout, function( ) {
        const result = buildTimeoutResult(url, timeout);
        hasTimedOut = true;

        console.log('Request timed out.');

        sendSnsEvent(snsTopicArn, "site-monitor-result", result)
            .then(() => callback())
            .catch(err => callback(err));
    });

    req.on('error', callback);

    req.end();
};
