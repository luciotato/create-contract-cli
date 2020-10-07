#!/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CLIConfig_js_1 = require("./CLIConfig.js");
const ContractAPI_js_1 = require("./ContractAPI.js");
const CLIOptions_js_1 = require("./CLIOptions.js");
const CommandLineArgs_js_1 = require("./util/CommandLineArgs.js");
const color = require("./util/color.js");
const ExtensionAPI_js_1 = require("./ExtensionAPI.js");
const saveConfig_js_1 = require("./util/saveConfig.js");
// default accountId
CLIOptions_js_1.options.accountId.value = CLIConfig_js_1.cliConfig.userAccount;
// process command line args
const args = new CommandLineArgs_js_1.CommandLineArgs(CLIOptions_js_1.options);
// command is the 1st positional argument
const command = args.getCommand();
// Show config info if requested
// Set config if requested
if (CLIOptions_js_1.options.cliConfig.value) {
    saveConfig_js_1.saveConfig(CLIOptions_js_1.options.accountId.value, CLIOptions_js_1.options.contractName.value);
    process.exit(0);
}
if (CLIOptions_js_1.options.info.value) {
    console.log(`config.js:`);
    console.log(`  Your account    : ${color.yellow}${CLIConfig_js_1.cliConfig.userAccount}${color.normal}`);
    console.log(`  Contract account: ${color.yellow}${CLIConfig_js_1.cliConfig.contractAccount}${color.normal}`);
    process.exit(0);
}
// TODO configure
// if (command=="configure") {
//     args.requireOptionString(options.accountId,"default account Id")
//     process.exit(0);
// }
// -------------------
// PROCESS COMMAND //
// -------------------
// get contract API + Extensions
const API = new ExtensionAPI_js_1.ExtensionAPI();
// check the command is in the API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (command && typeof API[command] !== "function") {
    color.logErr("unknown command " + color.yellow + command + color.normal);
    console.log(`${ContractAPI_js_1.nickname} --help to see a list of commands`);
    process.exit(1);
}
// Show help if requested or if no command
if (CLIOptions_js_1.options.help.value || !command) {
    CommandLineArgs_js_1.ShowHelpPage(command, API, CLIOptions_js_1.options);
    process.exit(0);
}
// call the contract API function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
API[command](args);
//# sourceMappingURL=tom.js.map