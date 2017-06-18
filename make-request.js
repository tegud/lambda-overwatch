const AWS = require("aws-sdk");
const request = require('request');

function buildResult(url, response, timeout, ttfb) {
    const result = {
        url: url,
        statusCode: response.statusCode,
        success: response.statusCode === 200,
        timeout: timeout
    };

    if (result.success) {
        result.timeToFirstByte = ttfb;

        return result;
    }

    result.errorMessage = `Error response code ${response.statusCode} from url: ${url}`;

    return result;
}

function buildTimeoutResult(url, timeout) {
    return {
        success: false,
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
            if (err) {
                reject(`Failed to send SNS ${err}`);
            }

            resolve();
        });
    });
}

module.exports.makeRequest = (event, context, callback) => {
    const url = event.url;
    const timeout = event.timeout || 3000;
    const start = new Date().valueOf();

    const accountId = process.env.accountId;
    const region = event.region;
    const snsTopic = event.snsTopic;

    const snsTopicArn = `arn:aws:sns:${region}:${accountId}:${snsTopic}`;

    if (!region || !snsTopic) {
        console.log('Region or sns topic not set')
        console.log(JSON.stringify(event, null, 4));
        return callback(new Error('Region or sns topic not set'));
    }

    if (!accountId) {
        console.log('AccountID not set');
        return callback(new Error('AccountID not set'));
    }

    console.log(`Testing url: ${url}, with timeout: ${timeout}, SNS ARN: ${snsTopicArn}`);

    if (!url) {
        console.log(JSON.stringify(event, null, 4));
        console.log('**********************************');
        console.log(JSON.stringify(context, null, 4));
        return callback(new Error('No url provided'));
    }

    request({
        url: url,
        timeout: timeout
    }, (err, res) => {
        const end = new Date().valueOf();

        if (err) {
            if (err.code === 'ETIMEDOUT') {
                const result = buildTimeoutResult(url, timeout);

                console.log('Request timed out.');

                sendSnsEvent(snsTopicArn, "site-monitor-result", result)
                    .then(() => callback())
                    .catch(err => callback(err));

                return;
            }

            sendSnsEvent(snsTopicArn, "site-monitor-result", {
                success: false,
                url: url,
                timeout: timeout,
                errorMessage: err.message || err
            })
                .then(() => callback())
                .catch(err => callback(err))
        }

        const result = buildResult(url, res, timeout, end - start);

        sendSnsEvent(snsTopicArn, "site-monitor-result", result)
            .then(() => callback())
            .catch(err => callback(err));
    });
};
