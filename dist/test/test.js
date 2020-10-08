"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_Tokenizer_js_1 = require("./test.Tokenizer.js");
const test_ContractAPI_js_1 = require("./test.ContractAPI.js");
const expect_js_1 = require("./expect.js");
const child_process = require("child_process");
const color = require("../lib/util/color.js");
const CommandLineArgs = require("../../res/model-ES2018/util/CommandLineArgs.js");
const options = require("../../res/model-ES2018/CLIOptions.js");
const nickname = "testy";
const contractCliPath = "out/" + nickname + "-cli";
//-----------------------------------
// helper fn spawn 
//-----------------------------------
function spawn(cmd, args, spawnOpt) {
    const spawnOptions = {
        shell: true,
        //cwd: basedir,
        stdio: "inherit"
    };
    if (!spawnOpt || !spawnOpt["hideCommand"])
        console.log(color.yellow, ">", cmd, ...args, color.normal);
    const execResult = child_process.spawnSync(cmd, args, spawnOptions);
    if (execResult.error) {
        color.logErr(execResult.error.message);
        process.exit(5);
    }
    if (execResult.status !== 0 && (!spawnOpt || spawnOpt["ignoreExitStatus"] == false)) {
        color.logErr(`exit status:${execResult.status}: ${cmd} ${args.join(" ")}`);
        process.exit(execResult.status);
    }
    return execResult.status;
}
//-----------------------------------
// helper fn near => spawn near-cli
//-----------------------------------
function near(command, args, spawnOpt) {
    args.unshift(command);
    return spawn("near", args, spawnOpt);
}
//-----------------------------------
// helper fn node => spawn node
//-----------------------------------
function node(command, args, spawnOpt) {
    const argsArray = args.split(" ");
    argsArray.unshift(command);
    return spawn("node", argsArray, spawnOpt);
}
//-----------------------------------
// helper fn cli => spawn node nickname
//-----------------------------------
function cli(args, spawnOpt) {
    console.log(color.yellow, ">", nickname, args, color.normal);
    const argsArray = args.split(" ");
    argsArray.unshift(contractCliPath);
    if (!spawnOpt)
        spawnOpt = {};
    spawnOpt["hideCommand"] = true;
    return spawn("node", argsArray, spawnOpt);
}
//-----------------------------
function testCLIparser() {
    let cmdline = `node nearswap add_liquidity { token: "gold.nearswap.testnet", max_tokens: 10, min_shares: 5 } --amount 10`;
    process.argv = cmdline.split(' ');
    let a = new CommandLineArgs(options);
    expect_js_1.default("command", a.consumeString("cmd")).toBe("add_liquidity");
    expect_js_1.default("JSON", a.consumeJSON("json args")).toBe({ token: '"gold.nearswap.testnet"', max_tokens: "10" + "".padEnd(24, "0"), min_shares: "5" + "".padEnd(24, "0") });
    expect_js_1.default("options.amount", options.amount.value).toBe(10);
    //no spaces around { }
    cmdline = `node nearswap add_liquidity {token:gold.nearswap.testnet max_tokens:10 min_shares:5} --amount 10`;
    process.argv = cmdline.split(' ');
    a = new CommandLineArgs(options);
    expect_js_1.default("command", a.consumeString("cmd")).toBe("add_liquidity");
    expect_js_1.default("JSON", a.consumeJSON("json args")).toBe({ token: "gold.nearswap.testnet", max_tokens: "10" + "".padEnd(24, "0"), min_shares: "5" + "".padEnd(24, "0") });
    expect_js_1.default("options.amount", options.amount.value).toBe(10);
    //no spaces around { } v2
    cmdline = `node staky new {account:lucio.testnet, reward_fee_fraction: {numerator:10i, denominator:8i}} --amount 10N`;
    process.argv = cmdline.split(' ');
    a = new CommandLineArgs(options);
    expect_js_1.default("command", a.consumeString("cmd")).toBe("new");
    expect_js_1.default("JSON", a.consumeJSON("json args")).toBe({ account: "lucio.testnet", reward_fee_fraction: { numerator: 10, denominator: 8 } });
    expect_js_1.default("options.amount", options.amount.value).toBe("10N");
}
//------------------------------------------------------
console.log("---------- START PARSE TESTS ---------");
spawn("rm", ["-rf", "out"]);
testCLIparser();
test_Tokenizer_js_1.testTokenizer();
test_ContractAPI_js_1.testContractAPIProducer();
console.log("---------- END PARSE TESTS ---------");
//------------------------------------------------------
console.log("---------- START dist/main/create-contract-cli TEST ---------");
const contractAccount = "AcontractAccount";
const userAccount = "AuserAccount";
const outDir = "out";
//create contract-cli named 'staky' for the deployed staking-pool
node(`dist/main/create-contract-cli`, `${nickname} res/test/rust/staking-pool --contractName ${contractAccount} --accountId ${userAccount} --nolink -o ${outDir}`);
//test json parsing
//test configure contractName & accountId
cli("--cliConfig --contractName contract.account.testnet --accountId yourAccount.near");
cli("--info");
cli(`--cliConfig --contractName ${contractAccount} --accountId test.near`);
cli("--info");
//cleanup
spawn("rm", ["-rf", "out"]);
console.log("---------- dist/main/create-contract-cli ---------");
//# sourceMappingURL=test.js.map