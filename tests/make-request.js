'use strict';

const should = require('should');
const proxyquire = require('proxyquire').noCallThru();
const FakeHttpServer = require('./lib/fake-http-server');

const awsSdk = new require('./lib/fake-aws-sdk')();
const makeRequest = proxyquire('../make-request', {
    'aws-sdk': awsSdk
});

describe('make-request', () => {
    let httpServer;

    beforeEach(() => {
        httpServer = new FakeHttpServer();
        return Promise.all[
            httpServer.start(),
            awsSdk.start()
        ];
    });
    afterEach(() => httpServer.stop());

    it('calls the url specified in the supplied event', () => new Promise(resolve => {
        httpServer.on('request-handled', () => resolve());

        makeRequest.handler({ url: 'http://localhost:1234' }, {}, () => { });
    }));

    describe('successful response', () => {
        it('places result on SNS topic', () => (() => new Promise(resolve => {
            awsSdk.on('SNS', '%RESULT_SNS_TOPIC_ARN%', 'message-received', payload => resolve(JSON.parse(payload.Message)));

            makeRequest.handler({ url: 'http://localhost:1234' }, {}, () => { });
        }))().should.eventually.have.properties({
            "success":true
        }));

        it('sets timeToFirstByte', () => (() => new Promise(resolve => {
            awsSdk.on('SNS', '%RESULT_SNS_TOPIC_ARN%', 'message-received', payload => resolve(JSON.parse(payload.Message)));

            makeRequest.handler({ url: 'http://localhost:1234' }, {}, () => { });
        }))().should.eventually.have.properties("timeToFirstByte"));
    });
});
