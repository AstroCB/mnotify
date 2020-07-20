const fs = require("fs");
const chalk = require("chalk");

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

exports.updateLogin = (config, api) => {
    config.appState = api.getAppState();
    fs.writeFile(exports.getConfigPath(), JSON.stringify(config), () => { });
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

// Stored options for common invocations

exports.silentOpt = {
    "logLevel": "silent"
}

exports.passOpts = {
    hideEchoBack: true,
    mask: ""
}