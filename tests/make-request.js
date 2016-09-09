'use strict';

const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const http = require('http');
const makeRequest = proxyquire('../make-request', {
    'aws-sdk': {}
});

function FakeHttpServer() {
    let eventEmitter;

    var server = http.createServer((request, response) => {
        eventEmitter.emit('request-handled');
        response.writeHead(200);
        response.end();
    });

    return {
        start: () => new Promise(resolve => {
            eventEmitter = new EventEmitter();
            server.listen(1234, () => resolve());
        }),
        stop: () => new Promise(resolve => resolve(server.close())),
        on: (eventName, fn) => new Promise(resolve => {
            eventEmitter.on(eventName, fn);
            resolve();
        })
    };
};

describe('make-request', () => {
    let httpServer;

    beforeEach(() => {
        httpServer = new FakeHttpServer();
        return httpServer.start();
    });
    afterEach(() => httpServer.stop());

    it('calls the url specified in the supplied event', () => new Promise(resolve => {
        httpServer.on('request-handled', () => resolve());

        makeRequest.handler({ url: 'http://localhost:1234' }, {}, () => { });
    }));
});
