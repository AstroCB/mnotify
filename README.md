mnotify
=======

[![NPM](https://nodei.co/npm/mnotify.png)](https://npmjs.org/package/mnotify)

mnotify is a simple command-line utility for sending notifications through Facebook Messenger. It takes input from stdin and sends it to a pre-configured recipient (presumably, you). It's great for sending yourself build notifications, cronjob alerts, or anything else that is worthy of a ping.

It works by accepting arbitrary input from stdin, and then sending that data to a preconfigured user over Messenger. Here's an example:

```
do_some_long_running_task && echo "Task done" | mnotify
```

You'll receive a message when the task has finished. For a more practical example, you can receive notifications when a build is finished:

```
make giant_codebase | mnotify
```

Then, you can go grab a coffee or take a walk while your build runs, and you'll get the entire log sent to your phone when it finishes (or fails 😞).

Lastly, you can use mnotify to send you alerts when certain jobs run (e.g. cron jobs or service disruption events):

```
59 19 * * * ~/scripts/get-daily-covid-stats | mnotify
```

## Installation

You can install from npm:

```
npm install -g mnotify
```

Once installed, you **must** configure mnotify before using it:

```
mnotify --init
```

This will allow you to log in with the accounts required to send and receive notifications (which can be the same) and cache the resulting session to prevent you from having to log in every time. You'll also be given the option to store your account credentials to automatically retry logging in when your session expires. This is the recommended option, as it minimizes maintenance, but it's less secure since your login credentials will be stored in plaintext. If you need to alter any of this information, simply run the `init` command again.

This utility respects the [XDG Base Directory specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html), and will store all of the configuration information set at initialization in the directory specified by the `XDG_CONFIG_HOME` environment variable, if it exists. Otherwise, it will be stored in `$HOME/.config`.

For more information and commands, see

```
mnotify --help
```