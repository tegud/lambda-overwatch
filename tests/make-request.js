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
                Protocol: 'http',
                TopicArn: 'arn:aws:sns:eu-west-1:DUMMYID:complete'
            }, (err, event, message) => {
                if(err) {
                    console.log(`Error subscribing to topic: ${err.message}`);
                    return resolve();
                }

                console.log(err);
                console.log(event);
                console.log(message);
                lastMessage = message;

                resolve();
            })))
    });

    it.skip('sends a message to SNS', () => (() => new Promise(resolve => makeRequest({
        url: "https://www.tegud.net",
        region: "eu-west-1",
        snsTopic: "complete"
    }, {}, err => {
        if(err) {
            console.log(err);
        }
        resolve(lastMessage);
    })))()
        .should.eventually.eql({}));
});
