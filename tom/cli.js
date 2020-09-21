"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandLineArgs_1 = require("./util/CommandLineArgs");
const ShowHelpPage_1 = require("./util/ShowHelpPage");
const ContractAPI_1 = require("./ContractAPI");
const CommonCLIOptions_1 = require("./util/CommonCLIOptions");
const API = new ContractAPI_1.ContractAPI();
var args = new CommandLineArgs_1.CommandLineArgs(CommonCLIOptions_1.commonCliOptions);
//default network
if (!args.options.networkId)
    args.options.networkId = "betanet";
//special case, no command, general help
if (args.command == "--help") {
    ShowHelpPage_1.ShowHelpPage(API, CommonCLIOptions_1.commonCliOptions);
    process.exit(0);
}
//check if the command is in the API
if (typeof API[args.command] != "function") {
    console.log("ERROR: unknown command " + args.command);
    console.log(`${ContractAPI_1.NickName} --help to see a list of commands`);
    process.exit(1);
}
//call the contract API -> near-cli
API[args.command](args);
//# sourceMappingURL=tom.js.map