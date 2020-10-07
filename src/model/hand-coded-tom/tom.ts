#!/bin/node
import { config } from "./config.js"
import { nickname } from "./ContractAPI.js"
import { options } from "./CLIOptions.js"
import { CommandLineArgs, ShowHelpPage } from "./util/CommandLineArgs.js"
import * as color from "./util/color.js"
import * as nearCli from "./util/SpawnNearCli.js"
import { ExtensionAPI } from "./ExtensionAPI.js"

// default accountId
options.accountId.value = config.userAccount

// process command line args
const args = new CommandLineArgs(options)

// command is the 1st positional argument
const command = args.getCommand()

// Show info if requested
if (options.info.value) {
    console.log(`config.js:`)
    console.log(`  Your account    : ${color.yellow}${config.userAccount}${color.normal}`)
    console.log(`  Contract account: ${color.yellow}${config.contractAccount}${color.normal}`)
    process.exit(0)
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
const API = new ExtensionAPI()

// check the command is in the API
if (command && typeof (API as any)[command] !== "function") {
    color.logErr("unknown command " + color.yellow + command + color.normal)
    console.log(`${nickname} --help to see a list of commands`)
    process.exit(1)
}

// Show help if requested or if no command
if (options.help.value || !command) {
    ShowHelpPage(command, API, options)
    process.exit(0)
}

// call the contract API function
(API as any)[command](args)
