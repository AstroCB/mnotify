const login = require('facebook-chat-api');
const chalk = require('chalk');
const init = require('./init');

let config;
try {
    load_config();
} catch(e) {
    console.log(`${chalk.black.bgYellowBright.bold("WARN")} mnotify must be configured before you can use it. Running ${chalk.blue("mnotify init")}...\n`);
    init.init(success => {
        
    });
}

function load_config() {
    throw Error("yeet")
}