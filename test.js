const mnotify = require(".");

mnotify.init({
    "usingBotCore": true
}, err => {
    if (err) {
        console.error(`Test failed: ${err}`);
        process.exit(1);
    } else {
        mnotify.notify("Test succeeded.");
    }
})