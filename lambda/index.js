const Alexa = require('ask-sdk-core');

const showVersion = require('./actions/showVersionAction').handler;

//On launch, show our screen.  This will post us back a SendVersion event which will contain view state
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return showVersion(handlerInput);
    }
};

//Handler for SendVersion event that will post back the APL runtime version.
const SendVersionInfo = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) == "Alexa.Presentation.APL.UserEvent" && Alexa.getRequest(handlerInput.requestEnvelope).arguments[0] == "SendVersion";
    },
    handle(handlerInput) {
        var version = 'Exception finding version';
        var promptToRetry = false;

        try {
            //When APL is on the screen, the view state includes the version information
            var aplPayload = handlerInput.requestEnvelope.context["Alexa.Presentation.APL"];
            if(!aplPayload) {
                version = "No APL context.  Tap to retry";
                promptToRetry = true;
            } else {
                if(aplPayload.version) {
                    version = aplPayload.version;
                } else {
                    version = "No version in APL context."
                }
            }
        } catch {
        }


        var response = handlerInput.responseBuilder;
        
        response.addDirective({
                type : 'Alexa.Presentation.APL.ExecuteCommands',
                token: "VersionInfo",
                "commands": [
                    {
                        "type": "SetStatus",
                        "text": `${version}`,
                    }                    
                ]
            });

        if(promptToRetry) {
            response.speak("No version found.  Tap version to retry")
        }

        return response.getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'This skill displays device information on the screen that is of use to engineers';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const DummyIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DummyIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        SendVersionInfo,
        DummyIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
        ) 
    .addErrorHandlers(
        ErrorHandler,
        )
    .addRequestInterceptors(function(requestEnvelope) {
            //Interceptor to log everything we get
            console.log("\n" + "******************* REQUEST ENVELOPE **********************");
            console.log("\n" + JSON.stringify(requestEnvelope, null, 4));
      })
    .addResponseInterceptors(function(requestEnvelope, response){
            //Interceptor to log everything we send
            console.log("\n" + "******************* RESPONSE  **********************");
            console.log("\n" + JSON.stringify(response, null, 4));
        })              
    .lambda();
