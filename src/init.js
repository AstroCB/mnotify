#! /usr/bin/env node

// Stdlib
const fs = require("fs");

// Locals
const tools = require("./tools");

// Third party deps
const login = require("facebook-chat-api");
const chalk = require("chalk");
const rl = require("readline-sync");


function init(callback) {
    tools.printHeader();

    console.log(`To start, we need some credentials: one for an account that \
will send the alerts, and one for an account that will receive them (these \
can be the same account, probably yours, or you can create a dummy sender \
account).\n\nBy default, these credentials will not be stored for security \
reasons, but the session token identifying your login will be stored at \
${chalk.yellow(tools.getConfigDir())} (to change this, set your \
${chalk.grey("XDG_CONFIG_HOME")} environment variable).`);

    const sendEmail = rl.questionEMail("Sender account email: ");
    const sendPass = rl.question("Sender account password: ", tools.passOpts);
    const isSame = rl.keyInYN("Are the sender and receiver accounts the same?");

    getRecvCreds(isSame, sendEmail, sendPass, (recvEmail, recvPass) => {
        const shouldStore = askToStore();

        console.log(chalk.yellow("Logging in; this may take a while..."));
        storePrefs(sendEmail, sendPass, recvEmail, recvPass, shouldStore, getRecvApi, (err, _) => {
            if (err) {
                console.log(`${chalk.red("Unable to store your information; your account credentials may be incorrect. \
Please try running")} ${chalk.blue("mnotify --init")} ${chalk.red("again.")}`);
                callback(false);
            } else {
                console.log("Initialized and ready to go! You can now use mnotify.")
                callback(true);
            }
        });
    });
}

function askToStore() {
    console.log(`\n${chalk.yellow("Important!")} Your login \
session will be stored, but will eventually expire. We can also store your \
sender account credentials and re-log in for you when this happens, but this \
involves storing your credentials in plaintext, which may compromise your \
account security. (We don't need to store the receiver account because we \
only log into it once to get a user ID.)`);
    return rl.keyInYN("Would you like to store the sender account credentials?");
}

function getRecvCreds(isSame, sendEmail, sendPass, callback) {
    // Check for false explicitly to make 'y' default behavior
    const recvEmail = isSame !== false ? sendEmail : rl.questionEMail("Receiver account email: ");
    const recvPass = isSame !== false ? sendPass : rl.question("Receiver account password: ", tools.passOpts);

    callback(recvEmail, recvPass);
}

function storePrefs(sendEmail, sendPass, recvEmail, recvPass, shouldStore, recvApiFunc, callback) {
    login({
        "email": sendEmail,
        "password": sendPass
    }, tools.silentOpt, (sendErr, sendApi) => {
        recvApiFunc(sendErr, sendApi, sendEmail, recvEmail, recvPass, (recvErr, recvApi) => {
            if (sendErr || recvErr) {
                return callback(sendErr || recvErr);
            }

            // Successful logins for both
            const recvId = recvApi.getCurrentUserID();
            const sendSession = sendApi.getAppState();

            recvApi.getUserInfo(recvId, (err, info) => {
                const name = !err ? info[recvId].name : null;
                const nameStr = name ? `Notifications will be sent to ${chalk.blue(name)}. ` : "";

                const config = {
                    "recipient": recvId,
                    "appState": sendSession
                }

                if (shouldStore) {
                    config["email"] = sendEmail;
                    config["password"] = sendPass;
                }

                console.log(`${chalk.green("Login successful.")} ${nameStr}Storing your session in ${chalk.yellow(tools.getConfigDir())}...`);
                tools.saveConfig(config, err => {
                    callback(err, sendApi);
                });
            });
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
        }, tools.silentOpt, callback);
    }
}

// Expose some useful functions...
exports.init = init;
exports.storePrefs = storePrefs;
exports.askToStore = askToStore;

exports.programmaticInit = (creds, callback) => {
    if (creds.usingBotCore) {
        tools.botcoreLogin(callback)
    } else {
        storePrefs(creds.senderEmail,
            creds.senderPass,
            creds.receiverEmail,
            creds.receiverPass,
            creds.storeSenderCredentials,
            getRecvApi,
            (err, _) => {
                callback(err);
            }
        );
    }
};

if (require.main === module) {
    init(() => { });
}