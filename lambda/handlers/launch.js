const Alexa = require('ask-sdk-core');

const showVersion = require('../actions/showVersionAction').handler;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return showVersion(handlerInput);
    }
};

 exports.handler = LaunchRequestHandler;