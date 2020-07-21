// Public API

module.exports = {
    // Expose a notification function for programmatic use
    "notify": require("./src/mnotify").notify,

    // Expose initializastion for programmatic use
    "init": require("./src/init").programmaticInit
}