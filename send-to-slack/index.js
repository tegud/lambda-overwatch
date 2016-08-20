'use strict';

const AWS = require("aws-sdk");
const https = require("https");
const slackWebhookPath = "%SLACK_WEBHOOK_PATH%";

exports.handler = function (event, context, callback) {
    const result = JSON.parse(event.Records[0].Sns.Message);

    const req = https.request({
        host: "hooks.slack.com",
        path: slackWebhookPath,
        method: "POST"
      }, (res) => {
      callback();
    });

    req.write(JSON.stringify({
        "text": `Site check result: ${result.url} ${result.success ? 'was successful' : 'failed'}.`
    }))
    req.end();
};
