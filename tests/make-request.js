const request = require('request');
const should = require('should');
const SNSSimulator = require('sns-simulator');
const AWS = require("aws-sdk");
const makeRequest = require('../make-request').makeRequest;
const express = require('express');
const http = require('http');

function createTopic(sns, name) {
    return new Promise(resolve => sns.createTopic({ Name: name }, () => resolve()));
}

function HttpServer(port = 3012) {
    const app = express();
    const httpServer = http.createServer(app);
    let statusCode = 200;
    let lastUserAgent;

    app.use((req, res) => {
        lastUserAgent = req.headers['user-agent'];

        res.status(statusCode);
        res.json({});
    });

    return {
        start: () => new Promise((resolve, reject) => httpServer.listen(port, err => {
            if (err) {
                return reject(err);
            }

            console.log(`Listening on port ${port}`);

            return resolve();
        })),
        stop: () => Promise.resolve(httpServer.close()),
        setStatusCode: newCode => Promise.resolve(statusCode = newCode),
        getLastUserAgent: () => Promise.resolve(lastUserAgent)
    };
}

describe('make-request', () => {
    const sns = new AWS.SNS();
    let lastMessage;
    let httpServer;

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

    beforeEach(() => {
        lastMessage = undefined;
        httpServer = new HttpServer();
        return httpServer.start();
    });

    afterEach(() => httpServer.stop());

    it('sends a message to SNS when successful', () => (() => new Promise(resolve => makeRequest({
            url: "http://localhost:3012",
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
        .should.eventually.eql({"url":"http://localhost:3012","statusCode":200,"success":true,"timeout":3000}));


    it('sends a message to SNS when request timed out', () => (() => new Promise(resolve => makeRequest({
            url: "http://localhost:3012",
            timeout: 1,
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
        .should.eventually.eql({"url":"http://localhost:3012","errorMessage": "Timeout after 1ms from url: http://localhost:3012","success":false,"timeout":1}));

    it('sends a message to SNS when server responds with non-200', () => httpServer.setStatusCode(503)
        .then(() => new Promise(resolve => makeRequest({
            url: "http://localhost:3012",
            region: "eu-west-1",
            snsTopic: "complete"
        }, {}, err => {
            if(err) {
                console.log(err);
            }

            const parsedMessage = JSON.parse(lastMessage);
            delete parsedMessage.timeToFirstByte;

            resolve(parsedMessage);
        })))
        .should.eventually.eql({"url":"http://localhost:3012","statusCode":503, "errorMessage": "Error response code 503 from url: http://localhost:3012","success":false,"timeout":3000}));

    it('sends a message to SNS when server does not respond on port', () => httpServer.setStatusCode(503)
        .then(() => new Promise(resolve => makeRequest({
            url: "http://localhost:3013",
            region: "eu-west-1",
            snsTopic: "complete"
        }, {}, err => {
            if(err) {
                console.log(err);
            }

            const parsedMessage = JSON.parse(lastMessage);
            delete parsedMessage.timeToFirstByte;

            resolve(parsedMessage);
        })))
        .should.eventually.eql({"url":"http://localhost:3013", "errorMessage": "Could not connect","success":false,"timeout":3000}));

    it('sets user-agent to lambda-overwatch', () => httpServer.setStatusCode(503)
        .then(() => new Promise(resolve => makeRequest({
            url: "http://localhost:3012",
            region: "eu-west-1",
            snsTopic: "complete"
        }, {}, err => {
            if(err) {
                console.log(err);
            }

            resolve();
        })))
        .then(() => httpServer.getLastUserAgent())
        .should.eventually.eql(`lambda-overwatch/1.0 (aws-lambda node-js/${process.version})`));
});
