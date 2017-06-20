const request = require('request');
const should = require('should');
const SNSSimulator = require('sns-simulator');
const AWS = require("aws-sdk");
const makeRequest = require('../make-request').makeRequest;

function createTopic(sns, name) {
    return new Promise(resolve => sns.createTopic({ Name: name }, () => resolve()));
}

describe('make-request', () => {
    const sns = new AWS.SNS();
    let lastMessage;

    before(() => {
        process.env.AWS_REGION = 'eu-west-1';
        process.env.accountId = 'DUMMYID';

        SNSSimulator.setup();

        return createTopic(sns, 'complete')
            .then(() => new Promise(resolve => sns.subscribe({
                Protocol: 'lambda',
                TopicArn: 'arn:aws:sns:eu-west-1:DUMMYID:complete',
                Endpoint: 'CollectResult'
            }, err => {
                if(err) {
                    console.log(`Error subscribing to topic: ${err.message}`);
                    return resolve();
                }

                resolve();
            })))
            .then(() => new Promise(resolve => {
                SNSSimulator.registerLambda('CollectResult', (event, message, cb) => {
                    lastMessage = event.Records[0].Sns.Message;
                    cb();
                });
                resolve();
            }))
    });

    it('sends a message to SNS', () => (() => new Promise(resolve => makeRequest({
            url: "https://www.tegud.net",
            region: "eu-west-1",
            snsTopic: "complete"
        }, {}, err => {
            if(err) {
                console.log(err);
            }

            const parsedMessage = JSON.parse(lastMessage);
            delete parsedMessage.timeToFirstByte;

            resolve(parsedMessage);
        })))()
        .should.eventually.eql({"url":"https://www.tegud.net","statusCode":200,"success":true,"timeout":3000}));
});
