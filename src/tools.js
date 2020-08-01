const fs = require("fs");
const chalk = require("chalk");
const login = require("facebook-chat-api");
const botcore = require("messenger-botcore");

// Location of config directory (respects user settings)
exports.getConfigDir = () => {
    const configRoot = process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : `${process.env.HOME}/.config`;
    return `${configRoot}/mnotify`;
}

exports.getConfigPath = () => {
    return `${exports.getConfigDir()}/mnotify-config.json`;
}

exports.configExists = () => {
    return fs.existsSync(exports.getConfigDir());
}

exports.loadConfig = () => {
    if (exports.configExists()) {
        const config = fs.readFileSync(exports.getConfigPath());
        return JSON.parse(config);
    } else {
        throw Error("Config not found");
    }
}

exports.saveConfig = (config, callback = () => { }) => {
    fs.writeFile(exports.getConfigPath(), JSON.stringify(config), callback);
}

exports.printNoConfigError = () => {
    console.log(`${chalk.red("Unable to load config. Try running ")}${chalk.blue("mnotify --init")}${chalk.red(".")}`);
}

exports.updateLogin = (config, api) => {
    config.appState = api.getAppState();
    exports.saveConfig(config);
}

exports.updatePassword = pass => {
    try {
        const config = exports.loadConfig();
        config.password = pass;
        exports.saveConfig(config);
    } catch {
        exports.printNoConfigError();
    }
}

exports.printHeader = () => {
    console.log(chalk.blue("======="));
    console.log(chalk.bgBlue("mnotify"));
    console.log(chalk.blue("======="));
}

exports.getStdin = cb => {
    process.stdin.on('readable', () => {
        const chunk = process.stdin.read();
        if (chunk !== null) {
            cb(chunk.toString());
        }
    });
}

exports.checkLogin = (fail, succeed) => {
    try {
        const config = exports.loadConfig();
        login({ "appState": config.appState }, exports.silentOpt, (err, _) => {
            if (err) {
                if (config.email && config.password) {
                    login({ "email": config.email, "password": config.password },
                        exports.silentOpt, (err, api) => {
                            if (err) {
                                fail()
                            } else {
                                // Re-login succeeded; need to update stored session
                                exports.updateLogin(config, api);
                                succeed();
                            }
                        });
                } else {
                    fail();
                }
            } else {
                succeed();
            }
        });
    } catch {
        fail()
    }
}

exports.botcoreLogin = callback => {
    const requiredVars = ["MEMCACHIER_USERNAME", "MEMCACHIER_SERVERS", "MEMCACHIER_PASSWORD"];
    requiredVars.forEach(v => {
        if (!process.env[v]) {
            return callback(`Failed to access BotCore; make sure your required credentials [${requiredVars.join(", ")}] \
are stored as environment variables: https://github.com/AstroCB/BotCore/blob/master/DOCS.md#credentialsobj`);
        }
    });

    botcore.login.login(process.env, (err, api) => {
        if (err) {
            callback(`Error with login: ${err}`);
        } else {
            // Close out BotCore memcache connection to avoid hanging
            const mem = botcore.login.getMemCache();
            if (mem) {
                mem.close();
            }

            let config;
            try {
                config = this.loadConfig();
            } catch {
                if (process.env.MNOTIFY_RECEIVER_ID) {
                    // Can bootstrap a config if receiver provided
                    config = {
                        "recipient": process.env.MNOTIFY_RECEIVER_ID,
                    }
                } else {
                    return callback(chalk.yellow(`Error loading config; even \
when logging in with BotCore, you must still configure mnotify to set up the \
receiver's account. Alternatively, expose an MNOTIFY_RECEIVER_ID in your environment.`));
                }
            }

            // Update the login in the config
            config.appState = api.getAppState();
            this.saveConfig(config, callback);
        }
    });
}

// Stored options for common invocations

exports.silentOpt = {
    "logLevel": "silent"
}

exports.passOpts = {
    hideEchoBack: true,
    mask: ""
}