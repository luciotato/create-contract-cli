const color = require("./util/color.js")
const nearCli = require("./util/SpawnNearCli.js")
const saveConfig = require("./util/saveConfig.js")
const CommandLineArgs= require("./util/CommandLineArgs.js")

const options = require("./CLIOptions.js")
const cliConfig = require("./CLIConfig.js")
const ExtensionAPI= require("./ExtensionAPI.js")

// name of this script
const nickname = cliConfig.nickname;

// default accountId
options.accountId.value = cliConfig.userAccount

// process command line args
const args = new CommandLineArgs(options)

// command is the 1st positional argument
const command = args.getCommand()

// Show config info if requested
// Set config if requested by --cliConfig
if (options.cliConfig.value) {
    saveConfig(options.accountId.value, options.contractName.value)
    process.exit(0)
}
if (options.info.value) {
    console.log(`config.js:`)
    console.log(`  Your account    : ${color.yellow}${cliConfig.userAccount}${color.normal}`)
    console.log(`  Contract account: ${color.yellow}${cliConfig.contractAccount}${color.normal}`)
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (command && typeof API[command] !== "function") {
    color.logErr("unknown command " + color.yellow + command + color.normal)
    console.log(`${nickname} --help to see a list of commands`)
    process.exit(1)
}

// Show help if requested or if no command
if (options.help.value || !command) {
    args.ShowHelpPage(command, API)
    process.exit(0)
}

// call the contract API function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
API[command](args)
