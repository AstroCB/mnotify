#! /usr/bin/env node
const chalk = require("chalk");
const tools = require("./tools");

tools.printHeader();
console.log(`Thanks for installing! Run ${chalk.blue("mnotify --init")} to get started.`);