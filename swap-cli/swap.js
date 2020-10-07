import { CommandLineArgs } from "./util/CommandLineArgs.js"
import { ShowHelpPage } from "./util/ShowHelpPage.js"
import { nickname, ContractAPI } from "./ContractAPI.js"
import { options } from "./CLIOptions.js"
const API = new ContractAPI()
const args = new CommandLineArgs(options)
// command is the 1st positional argument
const command = args.getCommand()
// check the command is in the API
if (command && typeof API[command] !== "function") {
    console.log("ERROR: unknown command " + command)
    console.log(`${nickname} --help to see a list of commands`)
    process.exit(1)
}
// Show help
if (options.help.value) {
    ShowHelpPage(command, API, options)
    process.exit(0)
}
// call the contract API -> near-cli
API[command](args)
// # sourceMappingURL=tom.js.map
