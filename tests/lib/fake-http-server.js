"use strict";

const EventEmitter = require('events');
const http = require('http');

module.exports = function FakeHttpServer() {
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
