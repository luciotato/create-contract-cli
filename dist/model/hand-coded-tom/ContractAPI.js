import * as nearCli from "./util/SpawnNearCli.js";
import { options } from "./CLIOptions.js";
import { cliConfig } from "./CLIConfig.js";
// name of this script
export const nickname = "tom";
// one function for each pub fn in the contract
// get parameters by consuming from CommandLineParser
export class ContractAPI {
    constructor() {
        this.deploy_help = `
    deploy a WASM file into the account ${cliConfig.contractAccount} and call init function
    
    usage:
    > ${nickname} deploy [--account xx] code.WASM new { owner_id:string, stake_public_key:string, reward_fee_fraction: { numerator:x, denominator:y } }
    
    example:
    > ${nickname} deploy code.WASM new { owner_id:lucio.near, stake_public_key:"7fa387483934", reward_fee_fraction: { numerator:8, denominator:100 } }
    willl deploy code.WASM at ${cliConfig.contractAccount} and then initialize it
    `;
        this.ping_help = `
    Distributes rewards and restakes if needed.
    
    usage:
    > ${nickname} ping `;
        this.get_accounts_help = `
    get registered accounts from the contract
    
    usage:
    > ${nickname} get_accounts { from_index:number, limit:number }
    
    example:
    > ${nickname} get_accounts { from_index:0, limit:10 }
    will get 10 accounts starting from 0
    `;
        this.deposit_help = `
    deposit into the contract for staking later
    
    usage:
    > ${nickname} deposit --attach Near-amount
    
    example:
    > ${nickname} deposit --attach 40N
    will deposit 40N on behalf of your account into the pool
    
    `;
        this.stake_help = `
stake deposited unstaked amount

usage:
> ${nickname} stake { amount: 10N }

example:
> ${nickname} stake { amount: 10N }
will stake 10N from the unstaked balance of myaccount.betanet 

`;
    }
    // this.view helper function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    view(command, fnJSONparams) {
        return nearCli.view(cliConfig.contractAccount, command, fnJSONparams, options);
    }
    // this.call helper function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    call(command, fnJSONparams) {
        return nearCli.call(cliConfig.contractAccount, command, fnJSONparams, options);
    }
    deploy(a) {
        const wasmFile = a.consumeString("wasmFile");
        a.optionalString("new"); // can be omitted
        const initArgs = a.consumeJSON("init fn params");
        a.noMoreArgs();
        nearCli.spawnNearCli([
            'deploy', cliConfig.contractAccount, wasmFile,
            "new", initArgs
        ], options);
    }
    ping(a) {
        a.noMoreArgs(); // end of arguments
        this.call("ping");
    }
    get_accounts(a) {
        const params = a.consumeJSON("{ from_index:number, limit:number }");
        a.noMoreArgs();
        return this.view("get_accounts", params);
    }
    deposit(a) {
        a.requireOptionWithAmount(options.amount, "N"); // require --amount, in Nears
        a.noMoreArgs();
        this.call("deposit");
    }
    stake(a) {
        const stakeJSONargs = a.consumeJSON("{ amount: x }");
        a.noMoreArgs();
        this.call("stake", stakeJSONargs);
    }
    get_total_staked_balance(a) {
        a.noMoreArgs();
        return this.view("get_total_staked_balance");
    }
    get_owner_id(a) {
        a.noMoreArgs();
        return this.view("get_owner_id");
    }
    get_staking_key(a) {
        a.noMoreArgs();
        return this.view("get_staking_key");
    }
}
//# sourceMappingURL=ContractAPI.js.map