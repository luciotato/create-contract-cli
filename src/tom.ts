import { CommandLineArgs} from "./util/CommandLineArgs"
import { ShowHelpPage } from "./util/ShowHelpPage"
import { NickName, ContractAPI } from "./ContractAPI"
import { commonCliOptions } from "./util/CommonCLIOptions"

const API = new ContractAPI()

var args = new CommandLineArgs(commonCliOptions)

//default network
if (!args.options.networkId) args.options.networkId="betanet"

//special case, no command, general help
if (args.command == "--help"){ 
    ShowHelpPage(API,commonCliOptions)
    process.exit(0)
}

//check if the command is in the API
if (typeof API[args.command] != "function"){
    console.log ("ERROR: unknown command "+args.command)
    console.log (`${NickName} --help to see a list of commands`)
    process.exit(1)
}

//call the contract API -> near-cli
API[args.command](args);
