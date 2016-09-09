"use strict";

const EventEmitter = require('events');

module.exports = function FakeHttpServer() {
    let eventEmitter;

    return {
        SNS: function() {
            return {
                publish: (data, callback) => {
                    eventEmitter.emit(`SNS::${data.TopicArn}::message-received`, data);
                }
            };
        },
        start: () => new Promise(resolve => {
            eventEmitter = new EventEmitter();
        }),
        on: (awsModule, arn, eventName, fn) => new Promise(resolve => {
            eventEmitter.on(`${awsModule}::${arn}::${eventName}`, fn);
            resolve();
        })
    };
};
