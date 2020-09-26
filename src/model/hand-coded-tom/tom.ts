import { CommandLineArgs } from "./util/CommandLineArgs.js"
import { ShowHelpPage } from "./util/ShowHelpPage.js"
import { NickName, ContractAPI } from "./ContractAPI.js"
import { commonCliOptions } from "./util/CommonCLIOptions.js"

const API:any = new ContractAPI()

const args = new CommandLineArgs(commonCliOptions)

//check if the command is in the API
if (args.command && typeof API[args.command] != "function") {
    console.log("ERROR: unknown command " + args.command)
    console.log(`${NickName} --help to see a list of commands`)
    process.exit(1)
}

//Show help
if (args.options.help) {
    ShowHelpPage(args.command, API, commonCliOptions)
    process.exit(0)
}

//default network
if (!args.options.networkId) {
    args.options.networkId = "betanet"
}

//call the contract API -> near-cli
API[args.command](args);
