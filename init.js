const fs = require('fs');
const login = require('facebook-chat-api');
const chalk = require('chalk');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function init(callback) {
    console.log("=======");
    console.log(chalk.bgBlue("mnotify"));
    console.log("=======");

    console.log(`To start, we need some credentials: one for an account that \
will send the alerts, and one for an account that will receive them (these \
can be the same account, probably yours). By default, these credentials will \
not be stored for security reasons.`);

    rl.question("Sender account email: ", sendEmail => {
        rl.question("Sender account password: ", sendPass => {
            rl.question("Are the sender and receiver accounts the same? (y/n, default y) ", same => {
                const isSame = same ? (same.length == 0 || same.toLowerCase() == "y") : true;

                getRecvCreds(isSame, sendEmail, sendPass, (recvEmail, recvPass) => {
                    console.log(`\n${chalk.yellow("Important!")} Your login \
session will be stored, but will eventually expire. We can also store your \
sender account credentials and re-log in for you when this happens, but this \
involves storing your credentials in plaintext, which may compromise your \
account security. (We don't need to store the receiver account because we \
only log into it once to get a user ID.)`);
                    rl.question("Would you like to store the sender account credentials? (y/n, default n) ", store => {
                        rl.close();
                        const shouldStore = store ? store.toLowerCase() == "y" : false;
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
                });
            });
        });
    });
}

function getRecvCreds(isSame, sendEmail, sendPass, callback) {
    if (isSame) {
        // Receiver same as sender
        callback(sendEmail, sendPass);
    } else {
        rl.question("Receiver account email: ", recvEmail => {
            rl.question("Receiver account password: ", recvPass => {
                callback(recvEmail, recvPass);
            });
        });
    }
}

function storePrefs(sendEmail, sendPass, recvEmail, recvPass, shouldStore, callback) {
    login({
        "email": sendEmail,
        "password": sendPass
    }, (sendErr, sendApi) => {
        getRecvApi(sendErr, sendApi, sendEmail, recvEmail, recvPass, (recvErr, recvApi) => {
            if (sendErr || recvErr) {
                return callback(sendErr || recvErr);
            }

            // Successful logins for both
            sendApi.setOptions({ "logLevel": "silent" });
            recvApi.setOptions({ "logLevel": "silent" });

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

            const configPath = `${getPath()}/mnotify`;

            if (!fs.existsSync(configPath)) {
                fs.mkdirSync(configPath);
            }

            fs.writeFileSync(`${configPath}/mnotify-config.json`, JSON.stringify(config));

            callback(null);
        });
    });
}

// Location of config path
function getPath() {
    return process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : `${process.env.HOME}/.config`;
}

function getRecvApi(sendErr, sendApi, sendEmail, recvEmail, recvPass, callback) {
    if (recvEmail == sendEmail) {
        callback(sendErr, sendApi);
    } else {
        login({
            "email": recvEmail,
            "password": recvPass
        }, callback);
    }
}

exports.init = init;