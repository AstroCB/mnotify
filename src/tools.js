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

exports.printHeader = () => {
    console.log(chalk.blue("======="));
    console.log(chalk.bgBlue("mnotify"));
    console.log(chalk.blue("======="));
}

// Stored options for common invocations

exports.silentOpt = {
    "logLevel": "silent"
}

exports.passOpts = {
    hideEchoBack: true,
    mask: ""
}