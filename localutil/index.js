////////////////////////////////////////////
//
// Hacky script to pull logs from CloudWatch
//

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');


//Figure out what ASK profile we are using and where our skill is

const askProfile = process.env['ASK_DEFAULT_PROFILE'] ?? 'default';

console.log(`Using ASK profile ${askProfile}.  Override by setting enviorment variable ASK_DEFAULT_PROFILE`);

var skillRoot = path.resolve('../');
var askStatesFile = path.resolve('../.ask/ask-states.json');

if (!fs.existsSync(askStatesFile)) {
    skillRoot = path.resolve('.');
    askStatesFile = path.resolve('.ask/ask-states.json');
}

console.log(`Skill in ${skillRoot}.  Using skill state from ${askStatesFile}`);


//Parse the skill metadata and figure out where it is deployed to and what accounts it's using

const allSkillResources = JSON.parse(fs.readFileSync(askStatesFile));
const skillResources = allSkillResources.profiles[askProfile];
const skillId = skillResources.skillId;

if(!skillResources || !skillResources.skillId) {
    console.log("ERROR : Looks like you don't have a skill deployed in this profile")
    return;
}

console.log(`Skill : ${skillResources.skillId}`);

const deployState = skillResources.skillInfrastructure['@ask-cli/cfn-deployer'].deployState;

console.log(`Stack : ${deployState.default.stackId}`);

const skillLogGroupARN = deployState.default.outputs.find(x => x.OutputKey === 'SkillLogGroup').OutputValue;
console.log(`Log Group ARN : ${skillLogGroupARN}`);
const skillLogRegion = skillLogGroupARN.split(':')[3];
const skillLogGroupName = skillLogGroupARN.split(':')[6]


// Read ASK and AWS config to figure out where that goes in AWS

const askConfigFile = path.join(require('os').homedir(), '/.ask/cli_config')

console.log(`ASK Config File : ${askConfigFile}`);

const askConfigData = JSON.parse(fs.readFileSync(askConfigFile));
const askProfileData = askConfigData.profiles[askProfile];

const awsProfile = askProfileData.aws_profile;

console.log(`AWS Profile : ${awsProfile}`);
var credentials = new AWS.SharedIniFileCredentials({ profile: awsProfile });
AWS.config.credentials = credentials;
AWS.config.update({ region: skillLogRegion });

const cloudwatchlogs = new AWS.CloudWatchLogs();

//Helper function to find out what identity we ended up resolving to.
async function whoAmI() {
    console.log("Checking identity")
    const sts = new AWS.STS();
    var identity = await sts.getCallerIdentity().promise();
    console.log(JSON.stringify(identity,null,'  '));
}


//Walk through logs and download
async function downloadLogs(logStreamName) {
    console.log(`Checking ${logStreamName}`);
    var nextToken = null;

    var allEvents = [];

    while (true) {
        var args = {
            logGroupName: skillLogGroupName,
            logStreamName: logStreamName,
            startFromHead: true,
            nextToken: nextToken
        };

        var logs = await cloudwatchlogs.getLogEvents(args).promise();

        if (logs.events.length > 0) {
            console.log(`Events found : ${logs.events.length}`);
            allEvents.push(...logs.events);

            if (logs.nextForwardToken == nextToken) {
                break
            } else {
                if (logs.events.length == 0) {
                    console.log("Do we need to ever get here?")
                }
                nextToken = logs.nextForwardToken;
            }
        } else {
            break;
        }
    }

    if( allEvents.length > 0 ) {
        const filename = path.join(skillRoot,'/data/' , logStreamName + '.json');
        const dirname = path.dirname(filename);
        if( !fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, {recursive:true});
        }
        fs.writeFileSync(filename, JSON.stringify( allEvents, null,'  '));

    }

}

//Walk through log group and kick off download of each log
async function getLogGroups() {
    var nextToken = null;
    while (true) {
        var args = {
            logGroupName: skillLogGroupName,
            nextToken: nextToken,
            descending: true
        };
        var logs = await cloudwatchlogs.describeLogStreams(args).promise();
        console.log(`Got ${logs.logStreams.length}`, logs)
        for (var c = 0; c < logs.logStreams.length; c++) {
            var streamInfo = logs.logStreams[c];

            await downloadLogs(streamInfo.logStreamName);
        }
        if (logs.nextToken) {
            console.log("  Next batch : " + logs.nextToken)
            nextToken = logs.nextToken;
        } else {
            break;
        }
        console.log(logs);
    }
}

//Async function we kick off
async function start() {
    await whoAmI();
    await getLogGroups();
    console.log("Done!");
}

start();