const AWS = require("aws-sdk");

function buildResult(url, response, timeout, ttfb) {
    const result = {
        url: url,
        statusCode: response.statusCode,
        success: response.statusCode === 200,
        timeout: timeout
    };

    if(result.success) {
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
            if(err) {
                reject(`Failed to send SNS ${err}`);
            }

            resolve();
        });
    });
}

module.exports.makeRequest = (event, context, callback) => {
    const url = event.url;
    const timeout = event.timeout || 3000;
    let hasTimedOut;
    const start = new Date().valueOf();

    const accountId = event.account;
    const region = event.region;
    const snsTopic = event.snsTopic;

    const snsTopicArn = `arn:aws:sns:${region}:${accountId}:${snsTopic}`;

    console.log(`Testing url: ${url}, with timeout: ${timeout}`);

    if(!url) {
        console.log(JSON.stringify(event, null, 4));
        console.log('**********************************');
        console.log(JSON.stringify(context, null, 4));
        return callback(new Error('No url provided'));
    }

    const req = require(url.startsWith('https://') ? 'https' : 'http').get(url, (res) => {
        const end = new Date().valueOf();
        if(hasTimedOut) {
            console.log('Timed out, but response has returned eventually, do nothing.');
            return;
        }

        const result = buildResult(url, res, timeout, end - start);

        sendSnsEvent(snsTopicArn, "site-monitor-result", result)
            .then(() => callback())
            .catch(err => callback(err));
    });

    req.setTimeout(timeout, () => {
        const result = buildTimeoutResult(url, timeout);
        hasTimedOut = true;

        console.log('Request timed out.');

        sendSnsEvent(snsTopicArn, "site-monitor-result", result)
            .then(() => callback())
            .catch(err => callback(err));
    });

    req.on('error', error => sendSnsEvent(snsTopicArn, "site-monitor-result", {
        success: false,
        url: url,
        timeout: timeout,
        errorMessage: error.code || error
    })
    .then(() => callback())
    .catch(err => callback(err)));

    req.end();
};
