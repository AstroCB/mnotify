#! /usr/bin/env node
const chalk = require("chalk");
const tools = require("./tools");

tools.printHeader();
console.log(`${chalk.yellow("INFO")} Run ${chalk.blue("mnotify --init")} to get started.`);