const https = require("https");

const propertyFieldTitles = {
    url: 'URL',
    statusCode: 'Status Code',
    errorMessage: 'Error',
    timeToFirstByte: { text: 'Time to First Byte', formatter: value => `${value}ms` },
    timeout: 'Timeout'
};

module.exports.sendToSlack = function (event, context, callback) {
    const result = JSON.parse(event.Records[0].Sns.Message);
    const slackWebhookPath = process.env.webhookUrl;

    const req = https.request({
        host: "hooks.slack.com",
        path: slackWebhookPath,
        method: "POST"
    }, () => {
        callback();
    });

    console.log(`Sending to slack path: "${slackWebhookPath}", message: "Site check result: ${result.url} ${result.success ? 'was successful' : 'failed'}"`);

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

                    if(typeof(propertyFieldTitles[currentProperty]) === 'string') {
                        fields.push({
                            "title": propertyFieldTitles[currentProperty],
                            "value": result[currentProperty],
                            "short": true
                        });
                    }
                    else {
                        fields.push({
                            "title": propertyFieldTitles[currentProperty].text,
                            "value": propertyFieldTitles[currentProperty].formatter(result[currentProperty]),
                            "short": true
                        });
                    }

                    return fields;
                }, [])
            }
        ]
    }))
    req.end();
};
