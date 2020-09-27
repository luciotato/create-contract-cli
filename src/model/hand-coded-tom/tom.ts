#!/bin/node
import { CommandLineArgs,ShowHelpPage } from "./util/CommandLineArgs.js"
import { nickname, ContractAPI } from "./ContractAPI.js"
import { options } from "./CLIOptions.js"
import * as color from "./util/color"

const API:any = new ContractAPI()

const args = new CommandLineArgs(options)

//command is the 1st positional argument
let command = args.getCommand()

//Show info if requested 
if (options.info.value) {
    console.log(`default ContractName: ${color.yellow}${options.contractName.value}${color.normal}`)
    console.log(`default user AccountId: ${color.yellow}${options.accountId.value}${color.normal}`)
    process.exit(0);
}

//check the command is in the API
if (command && typeof API[command] != "function") {
    color.logErr("unknown command " + color.yellow+command+color.normal)
    console.log(`${nickname} --help to see a list of commands`)
    process.exit(1)
}

//Show help if requested or if no command
if (options.help.value || !command) {
    ShowHelpPage(command, API, options)
    process.exit(0)
}

//call the contract API -> near-cli
API[command](args);
