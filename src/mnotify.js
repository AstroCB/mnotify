#! /usr/bin/env node

// Locals
const init = require("./init");
const tools = require("./tools")

// Stdlib
const fs = require("fs");

// Third party deps
const login = require("facebook-chat-api");
const chalk = require("chalk");
const rl = require("readline-sync");
const args = require("command-line-args");
const usage = require("command-line-usage");

// Command-line args
const argDefs = [
    { "name": "help", "alias": "h", "type": Boolean, "description": "Display this help message." },
    { "name": "init", "type": Boolean, "description": "Initialize mnotify so that it can be used to send notifications." }
];

const helpSections = [
    { "header": chalk.blue("mnotify"), "content": "mnotify is a simple command-line utility for sending notifications through Messenger. It takes input from stdin and sends it to a pre-configured recipient (presumably, you). It's great for sending yourself build notifications, cronjob alerts, or anything else that is worthy of a ping." },
    { "header": "Usage", "content": `${chalk.grey("$")} ${chalk.blue("mnotify")} [<options>]` },
    {
        "header": "Examples", "content": [
            { "example": `${chalk.grey("$")} echo $(date) | mnotify`, "description": "Determines the current date and notifies you." },
            { "example": `${chalk.grey("$")} mnotify --init`, "description": `Initializes mnotify (${chalk.red("required")} before running it normally).` },
            { "example": `${chalk.grey("$")} mnotify --help`, "description": "Prints this help message." }]
    },
    { "header": "Options", "optionList": argDefs }
]

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

function printHelp() {
    const guide = usage(helpSections);

    console.log(guide);
}

if (require.main === module) {
    const options = args(argDefs);

    if (options.init) {
        init.init(() => { });
    } else if (options.help) {
        printHelp();
    } else {
        start();
    }
}