lambda = require('../lambda/index.js');
context = require('./context.json')


function testPayload( payload ) {
    function callback(ret) {
        console.log("Callback invoked with payload " + JSON.stringify(ret));
    }
    var retval = lambda.handler(payload,context, callback);
    console.log("Returned value : " + JSON.stringify(retval));
}

//testPayload(require('./launch.json'))
testPayload(require('./Event-SendVersion.json'))
//testPayload(require('./Intent-Stop.json'))
//testPayload(require('./Event-SendVersionBroken.json'))

console.log("Done!");

