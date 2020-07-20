const login = require("facebook-chat-api");
const chalk = require("chalk");

const tools = require("./tools");

module.exports = (fail, succeed) => {
    try {
        const config = tools.loadConfig();
        login({ "appState": config.appState }, tools.silentOpt, (err, api) => {
            if (err) {
                if (config.email && config.password) {
                    login({ "email": config.email, "password": config.password },
                        tools.silentOpt, (err, api) => {
                            if (err) {
                                fail()
                            } else {
                                // Re-login succeeded; need to update stored session
                                tools.updateLogin(config, api);
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