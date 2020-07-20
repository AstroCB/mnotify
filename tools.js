const fs = require("fs");

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

// Stored options for common invocations

exports.silentOpt = {
    "logLevel": "silent"
}

exports.passOpts = {
    hideEchoBack: true,
    mask: ""
}