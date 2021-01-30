lambda = require('../lambda/index.js');
context = require('./context.json')


function testPayload( payload ) {
    function callback(err, response) {
        console.log("Callback invoked with error " + JSON.stringify(err));
        // console.log("Response : " + JSON.stringify(response));
    }
    var retval = lambda.handler(payload,context, callback);
    console.log("Returned value : " + JSON.stringify(retval));
}

//testPayload(require('./launch.json'))
//testPayload(require('./Event-SendVersion.json'))
testPayload(require('./Event-SendVersionBroken.json'))
//testPayload(require('./Intent-Stop.json'))

console.log("Done!");

