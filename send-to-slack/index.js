'use strict';

const AWS = require("aws-sdk");
const https = require("https");
const slackWebhookPath = "%SLACK_WEBHOOK_PATH%";

const propertyFieldTitles = {
    url: 'URL',
    statusCode: 'Status Code',
    errorMessage: 'Error',
    timeToFirstByte: 'Time to First Byte',
    timeout: 'Timeout'
};

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
        attachments: [
            {
            	"fallback": "Site check result: ${result.url} ${result.success ? 'was successful' : 'failed'}. ${result.errorMessage}",
                "text": `Site check result: ${result.url} ${result.success ? 'was successful' : 'failed'}.`,
            	"color": result.success ? "good" : "danger",
            	"fields": Object.keys(propertyFieldTitles).reduce((fields, currentProperty) => {
                    if(!result[currentProperty]) {
                        return fields;
                    }

                    fields.push({
            			"title": propertyFieldTitles[currentProperty],
            			"value": result[currentProperty],
            			"short": true
            		});

                    return fields;
                }, [])
            }
        ]
    }))
    req.end();
};
