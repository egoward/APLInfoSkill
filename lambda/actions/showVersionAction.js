// Generate a 

const Alexa = require('ask-sdk-core');

const jsonTemplate = require('../templates/apl_template_json.json');

function explodeObjectToArrays(name, obj) {
    var ret = { id: name, children: [] };

    if (obj === null)
        ret.value = 'null';
    else if (obj === 0)
        ret.value = '0';
    else if (obj === false)
        ret.value = 'false'
    else if (obj instanceof Object) {
        //Cover arrays and key/value objects
        for (var k of Object.keys(obj)) {
            ret.children.push(explodeObjectToArrays(k.toString(), obj[k]));
        }
    }
    else {
        ret.value = obj.toString();
    }

    return ret;
}

exports.handler = function (handlerInput) {
    var aplSupport = Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'];
    if (!aplSupport) {
        return handlerInput.responseBuilder.speak("This device does not support APL").getResponse();
    }
    var aplSpecVersion = aplSupport.runtime.maxVersion;

    var cleanedRequest = JSON.parse(JSON.stringify(handlerInput.requestEnvelope));

    //Delete things that are too messy for the screen...
    delete cleanedRequest.session;
    delete cleanedRequest.context.System;

    var aplContext = cleanedRequest.context["Alexa.Presentation.APL"];
    if (aplContext) {
        delete cleanedRequest.context["Alexa.Presentation.APL"].componentsVisibleOnScreen;
    }

    var data = explodeObjectToArrays('requestEnvelope', cleanedRequest);
    data.type = 'object';

    var datasources = {
        view: {
            type: 'object',
            header: 'APL Spec ' + aplSpecVersion,
            footer: 'Waiting 1000ms',
        },
        data: data
    }
    return handlerInput.responseBuilder
        .speak("APL Spec " + aplSpecVersion)
        .addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "VersionInfo",
            document: jsonTemplate.document,
            datasources: datasources
        })
        .getResponse();
}