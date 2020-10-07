#!/bin/node
import { cliConfig } from "./CLIConfig.js";
import { nickname } from "./ContractAPI.js";
import { options } from "./CLIOptions.js";
import { CommandLineArgs, ShowHelpPage } from "./util/CommandLineArgs.js";
import * as color from "./util/color.js";
import { ExtensionAPI } from "./ExtensionAPI.js";
import { saveConfig } from "./util/saveConfig.js";
// default accountId
options.accountId.value = cliConfig.userAccount;
// process command line args
const args = new CommandLineArgs(options);
// command is the 1st positional argument
const command = args.getCommand();
// Show config info if requested
// Set config if requested
if (options.cliConfig.value) {
    saveConfig(options.accountId.value, options.contractName.value);
    process.exit(0);
}
if (options.info.value) {
    console.log(`config.js:`);
    console.log(`  Your account    : ${color.yellow}${cliConfig.userAccount}${color.normal}`);
    console.log(`  Contract account: ${color.yellow}${cliConfig.contractAccount}${color.normal}`);
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
const API = new ExtensionAPI();
// check the command is in the API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (command && typeof API[command] !== "function") {
    color.logErr("unknown command " + color.yellow + command + color.normal);
    console.log(`${nickname} --help to see a list of commands`);
    process.exit(1);
}
// Show help if requested or if no command
if (options.help.value || !command) {
    ShowHelpPage(command, API, options);
    process.exit(0);
}
// call the contract API function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
API[command](args);
//# sourceMappingURL=tom.js.map