"use strict";

const EventEmitter = require('events');
const http = require('http');

module.exports = function FakeHttpServer() {
    let eventEmitter;
    let timeout;

    var server = http.createServer((request, response) => {
        if(timeout) {
            return setTimeout(() => {
                eventEmitter.emit('request-handled');
                response.writeHead(200);
                response.end();
            }, timeout);
        }

        eventEmitter.emit('request-handled');
        response.writeHead(200);
        response.end();
    });

    return {
        start: () => new Promise(resolve => {
            timeout = 0;
            eventEmitter = new EventEmitter();
            server.listen(1234, () => resolve());
        }),
        stop: () => new Promise(resolve => resolve(server.close())),
        setTimeoutTo: newTimeout => {
            timeout = newTimeout;
            return new Promise(resolve => resolve());
        },
        on: (eventName, fn) => new Promise(resolve => {
            eventEmitter.on(eventName, fn);
            resolve();
        })
    };
};
