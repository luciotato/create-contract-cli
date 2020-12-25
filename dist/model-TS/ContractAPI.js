"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractAPI = exports.nickname = void 0;
const nearCli = require("./util/SpawnNearCli.js");
const CLIOptions_js_1 = require("./CLIOptions.js");
const CLIConfig_js_1 = require("./CLIConfig.js");
// name of this script
exports.nickname = "tom";
// one function for each pub fn in the contract
// get parameters by consuming from CommandLineParser
class ContractAPI {
    constructor() {
        this.deploy_help = `
    deploy a WASM file into the account ${CLIConfig_js_1.cliConfig.contractAccount} and call init function
    
    usage:
    > ${exports.nickname} deploy [--account xx] code.WASM new { owner_id:string, stake_public_key:string, reward_fee_fraction: { numerator:x, denominator:y } }
    
    example:
    > ${exports.nickname} deploy code.WASM new { owner_id:lucio.near, stake_public_key:"7fa387483934", reward_fee_fraction: { numerator:8, denominator:100 } }
    willl deploy code.WASM at ${CLIConfig_js_1.cliConfig.contractAccount} and then initialize it
    `;
        this.ping_help = `
    Distributes rewards and restakes if needed.
    
    usage:
    > ${exports.nickname} ping `;
        this.get_accounts_help = `
    get registered accounts from the contract
    
    usage:
    > ${exports.nickname} get_accounts { from_index:number, limit:number }
    
    example:
    > ${exports.nickname} get_accounts { from_index:0, limit:10 }
    will get 10 accounts starting from 0
    `;
        this.deposit_help = `
    deposit into the contract for staking later
    
    usage:
    > ${exports.nickname} deposit --attach Near-amount
    
    example:
    > ${exports.nickname} deposit --attach 40N
    will deposit 40N on behalf of your account into the pool
    
    `;
        this.stake_help = `
stake deposited unstaked amount

usage:
> ${exports.nickname} stake { amount: 10N }

example:
> ${exports.nickname} stake { amount: 10N }
will stake 10N from the unstaked balance of myaccount.betanet 

`;
    }
    // this.view helper function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    _view(command, fnJSONparams) {
        return nearCli.view(CLIConfig_js_1.cliConfig.contractAccount, command, fnJSONparams, CLIOptions_js_1.options);
    }
    // this.call helper function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    _call(command, fnJSONparams) {
        return nearCli.call(CLIConfig_js_1.cliConfig.contractAccount, command, fnJSONparams, CLIOptions_js_1.options);
    }
    deploy(a) {
        const wasmFile = a.consumeString("wasmFile");
        a.optionalString("new"); // can be omitted
        const initArgs = a.consumeJSON("init fn params");
        a.noMoreArgs();
        nearCli.spawnNearCli([
            'deploy', CLIConfig_js_1.cliConfig.contractAccount, wasmFile,
            "new", initArgs
        ], CLIOptions_js_1.options);
    }
    ping(a) {
        a.noMoreArgs(); // end of arguments
        this._call("ping");
    }
    get_accounts(a) {
        const params = a.consumeJSON("{ from_index:number, limit:number }");
        a.noMoreArgs();
        return this._view("get_accounts", params);
    }
    deposit(a) {
        a.requireOptionWithAmount(CLIOptions_js_1.options.amount, "N"); // require --amount, in Nears
        a.noMoreArgs();
        this._call("deposit");
    }
    stake(a) {
        const stakeJSONargs = a.consumeJSON("{ amount: x }");
        a.noMoreArgs();
        this._call("stake", stakeJSONargs);
    }
    get_total_staked_balance(a) {
        a.noMoreArgs();
        return this._view("get_total_staked_balance");
    }
    get_owner_id(a) {
        a.noMoreArgs();
        return this._view("get_owner_id");
    }
    get_staking_key(a) {
        a.noMoreArgs();
        return this._view("get_staking_key");
    }
}
exports.ContractAPI = ContractAPI;
//# sourceMappingURL=ContractAPI.js.map