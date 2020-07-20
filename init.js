const fs = require('fs');
const login = require('facebook-chat-api');
const chalk = require('chalk');
const rl = require("readline-sync");

const tools = require("./tools");

const passOpts = {
    hideEchoBack: true,
    mask: ""
};

function init(callback) {
    console.log(chalk.blue("======="));
    console.log(chalk.bgBlue("mnotify"));
    console.log(chalk.blue("======="));

    console.log(`To start, we need some credentials: one for an account that \
will send the alerts, and one for an account that will receive them (these \
can be the same account, probably yours, or you can create a dummy sender \
account). By default, these credentials will not be stored for security reasons.`);

    const sendEmail = rl.questionEMail("Sender account email: ");
    const sendPass = rl.question("Sender account password: ", passOpts);
    const isSame = rl.keyInYN("Are the sender and receiver accounts the same?");

    getRecvCreds(isSame, sendEmail, sendPass, (recvEmail, recvPass) => {
        console.log(`\n${chalk.yellow("Important!")} Your login \
session will be stored, but will eventually expire. We can also store your \
sender account credentials and re-log in for you when this happens, but this \
involves storing your credentials in plaintext, which may compromise your \
account security. (We don't need to store the receiver account because we \
only log into it once to get a user ID.)`);
        const shouldStore = rl.keyInYN("Would you like to store the sender account credentials?");
        
        console.log(chalk.yellow("Logging in; this may take a while..."));
        storePrefs(sendEmail, sendPass, recvEmail, recvPass, shouldStore, err => {
            if (err) {
                console.log(`Unable to store your information; your account credentials may be incorrect. \
Please try running ${chalk.blue("mnotify init")} again.`);
                callback(false);
            } else {
                console.log("Logged in and ready to go! You can now use mnotify.")
                callback(true);
            }
        });
    });
}

function getRecvCreds(isSame, sendEmail, sendPass, callback) {
    // Check for false explicitly to make 'y' default behavior
    const recvEmail = isSame !== false ? sendEmail : rl.questionEMail("Receiver account email: ");
    const recvPass = isSame !== false ? sendPass : rl.question("Receiver account password: ", passOpts);

    callback(recvEmail, recvPass);
}

function storePrefs(sendEmail, sendPass, recvEmail, recvPass, shouldStore, callback) {
    login({
        "email": sendEmail,
        "password": sendPass
    }, { "logLevel": "silent" }, (sendErr, sendApi) => {
        getRecvApi(sendErr, sendApi, sendEmail, recvEmail, recvPass, (recvErr, recvApi) => {
            if (sendErr || recvErr) {
                return callback(sendErr || recvErr);
            }

            // Successful logins for both
            const recvId = recvApi.getCurrentUserID();
            const sendSession = recvApi.getAppState();

            const config = {
                "recipient": recvId,
                "session": sendSession
            }

            if (shouldStore) {
                config["email"] = sendEmail;
                config["password"] = sendPass;
            }

            const configPath = tools.getConfigPath();

            if (!fs.existsSync(configPath)) {
                fs.mkdirSync(configPath);
            }

            fs.writeFileSync(`${configPath}/mnotify-config.json`, JSON.stringify(config));
            callback(null);
        });
    });
}

function getRecvApi(sendErr, sendApi, sendEmail, recvEmail, recvPass, callback) {
    if (recvEmail == sendEmail) {
        callback(sendErr, sendApi);
    } else {
        login({
            "email": recvEmail,
            "password": recvPass
        }, { "logLevel": "silent" }, callback);
    }
}

exports.init = init;