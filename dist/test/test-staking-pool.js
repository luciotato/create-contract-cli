"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const mkPath = require("../lib/util/mkPath");
const color = require("../lib/util/color.js");
const child_process = require("child_process");
let nickname = "";
let contractCli = "";
//-----------------------------------
// helper fn spawn 
//-----------------------------------
function spawn(cmd, args, options) {
    const spawnOptions = {
        shell: true,
        //cwd: basedir,
        stdio: "inherit"
    };
    if (!options || !options["hideCommand"])
        console.log(color.yellow, ">", cmd, ...args, color.normal);
    const execResult = child_process.spawnSync(cmd, args, spawnOptions);
    if (execResult.error) {
        color.logErr(execResult.error.message);
        process.exit(5);
    }
    if (execResult.status !== 0 && (!options || options["ignoreExitStatus"] == false)) {
        color.logErr(`exit status:${execResult.status}: ${cmd} ${args.join(" ")}`);
        process.exit(execResult.status);
    }
    return execResult.status;
}
//-----------------------------------
// helper fn near => spawn near-cli
//-----------------------------------
function near(command, args, options) {
    args.unshift(command);
    return spawn("near", args, options);
}
//-----------------------------------
// helper fn node => spawn node
//-----------------------------------
function node(command, args, options) {
    const argsArray = args.split(" ");
    argsArray.unshift(command);
    return spawn("node", argsArray, options);
}
//-----------------------------------
// helper fn cli => spawn node nickname
//-----------------------------------
function cli(args, options) {
    console.log(color.yellow, ">", nickname, args, color.normal);
    const argsArray = args.split(" ");
    argsArray.unshift(contractCli);
    if (!options)
        options = {};
    options["hideCommand"] = true;
    return spawn("node", argsArray, options);
}
//-----------------------------------
//-----------------------------------
console.log("---------- START TESTNET DEPLOY TESTS ---------");
const validNetworks = ["test", "testnet", "ci", "development", "local"];
if (!validNetworks.includes(process.env.NODE_ENV)) {
    color.logErr("NODE_ENV must be one of: " + validNetworks.join("|"));
    process.exit(1);
}
// @ts-ignore -- import.meta.url
let basedir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..");
if (basedir.startsWith("\\"))
    basedir = basedir.slice(1); // windows compat remove extra "\"
basedir = path.relative(process.cwd(), basedir);
console.log(`basedir: ${basedir}`);
// create project dir
const outDir = path.join(basedir, "out");
process.stdout.write(`Creating dir ${outDir}/...`);
try {
    mkPath.create(outDir);
}
catch (ex) {
    color.logErr("can't mkdir " + outDir);
    throw (ex);
}
color.greenOK();
const contractAccountFile = path.join(basedir, "neardev", "dev-account");
const rustDir = path.join(basedir, "res", "test", "rust");
const wasmFile = path.join(rustDir, "staking-pool", "staking_pool.wasm");
//deploy the contract with near dev-deploy
near("dev-deploy", [wasmFile]);
//get contract account
const contractAccount = fs.readFileSync(contractAccountFile).toString();
near("state", [contractAccount]);
//create a user account different from the contract account
const userAccount = `user.${contractAccount}`;
near("create-account", [userAccount, "--masterAccount", contractAccount], { ignoreExitStatus: true });
//create contract-cli named 'staky' for the deployed staking-pool
nickname = "staky";
node(`dist/main/create-contract-cli`, `${nickname} res/test/rust/staking-pool --contractName ${contractAccount} --accountId ${userAccount} --nolink -o ${outDir}`);
//test new staky command
contractCli = path.join(outDir, `${nickname}-cli`, `${nickname}`);
//test call fn "new" - init the contract
cli(`new { owner_id:${userAccount}, stake_public_key:BnLACoaywKGfAEoeKn5HuiAzpn1NTcjTuUkjs44dMiPp, reward_fee_fraction: { numerator:8i, denominator:100i } }`, { ignoreExitStatus: true }); //ignore if alerady initialized
cli("get_owner_id");
cli("get_reward_fee_fraction");
//cli("deposit -am 1")
cli("deposit_and_stake -am 0.1");
cli("deposit_and_stake -am 0.2");
cli("deposit_and_stake -am 0.3");
cli("deposit_and_stake -am 0.5");
//cli("withdraw_all")
cli("ping");
console.log("---------- END TESTNET DEPLOY TESTS ---------");
//# sourceMappingURL=test-staking-pool.js.map