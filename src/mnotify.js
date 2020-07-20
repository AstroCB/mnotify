#! /usr/bin/env node

// Locals
const init = require("./init");
const tools = require("./tools")

// Stdlib
const fs = require("fs");

// Third party deps
const login = require('facebook-chat-api');
const chalk = require('chalk');
const rl = require("readline-sync");

function start() {
    getStdin(input => {
        try {
            loginWithConfig(load_config(), input);
        } catch (e) {
            console.log(`${chalk.black.bgYellowBright.bold("WARN")} mnotify must \
be configured before you can use it. Running ${chalk.blue("mnotify init")}...\n`);

            init.init(success => {
                if (!success) { return process.exit(1); }

                loginWithConfig(load_config(), input);
            });
        }
    });
}

function load_config() {
    if (tools.configExists()) {
        const config = fs.readFileSync(tools.getConfigPath());
        return JSON.parse(config);
    } else {
        throw Error("Config not found");
    }
}

function loginWithConfig(config, msg) {
    login({ "appState": config.appState }, tools.silentOpt, (err, api) => {
        if (err) {
            if (config.email && config.password) {
                login({ "email": config.email, "password": config.password },
                    tools.silentOpt, (err, api) => {
                        if (err) {
                            failedLogin(config, msg, true)
                        } else {
                            updateLogin(config, api)
                            notify(config, api, msg);
                        }
                    });
            } else {
                failedLogin(config, msg)
            }
        } else {
            notify(config, api, msg);
        }
    });
}

function failedLogin(config, msg, failedRetry = false) {
    const retryStr = failedRetry ? " An attempt was also made to re-login with \
your stored credentials, but this failed too (possibly due to a password change)." : "";

    console.log(chalk.red(`Your cached login has expired.${retryStr} Please log into your sender account again:`));
    redoLogin(config, newApi => {
        notify(config, newApi, msg);
    });
}

function redoLogin(config, callback) {
    const email = rl.questionEMail("Sender account email: ");
    const pass = rl.question("Sender account password: ", tools.passOpts);
    const shouldStore = init.askToStore();

    init.storePrefs(email, pass, null, null, shouldStore, (_, __, ___, ____, _____, cb) => {
        // Dummy func to tell it to store the same receiver ID
        cb(null, { getCurrentUserID: (() => config.recipient) })
    }, (err, api) => {
        if (err) {
            console.log(`${chalk.red("Failed to log in with your new information. \
Try again by running")} ${chalk.blue("mnotify init")}${chalk.red(".")}`);
            process.exit(1);
        } else {
            callback(api);
        }
    });
}

function updateLogin(config, api) {
    config.appState = api.getAppState();
    fs.writeFile(tools.getConfigPath(), JSON.stringify(config), () => { });
}

function getStdin(cb) {
    process.stdin.on('readable', () => {
        const chunk = process.stdin.read();
        if (chunk !== null) {
            cb(chunk.toString());
        }
    });
}

function notify(config, api, msg) {
    api.sendMessage(`New message from mnotify: ${msg}`, config.recipient);
}

if (require.main === module) {
    start();
}