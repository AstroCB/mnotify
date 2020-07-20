const fs = require("fs");
const chalk = require("chalk");
const login = require("facebook-chat-api");

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

exports.saveConfig = config => {
    fs.writeFile(exports.getConfigPath(), JSON.stringify(config), () => { });
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

// Stored options for common invocations

exports.silentOpt = {
    "logLevel": "silent"
}

exports.passOpts = {
    hideEchoBack: true,
    mask: ""
}