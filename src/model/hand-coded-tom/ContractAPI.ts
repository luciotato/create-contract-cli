import * as nearCli from "./util/SpawnNearCli.js"
import { CommandLineArgs } from "./util/CommandLineArgs.js"
import { options } from "./CLIOptions.js"
import { config } from "./config.js"

// name of this script
export const nickname = "tom"

// one function for each pub fn in the contract
// get parameters by consuming from CommandLineParser
export class ContractAPI {
    // this.view helper function
    view(command:string, fnJSONparams?:any) {
        return nearCli.view(config.contractAccount, command, fnJSONparams, options)
    }

    // this.call helper function
    call(command:string, fnJSONparams?:any) {
        return nearCli.call(config.contractAccount, command, fnJSONparams, options)
    }

    deploy_help = `
    deploy a WASM file into the account ${config.contractAccount} and call init function
    
    usage:
    > ${nickname} deploy [--account xx] code.WASM new { owner_id:string, stake_public_key:string, reward_fee_fraction: { numerator:x, denominator:y } }
    
    example:
    > ${nickname} deploy code.WASM new { owner_id:lucio.near, stake_public_key:"7fa387483934", reward_fee_fraction: { numerator:8, denominator:100 } }
    willl deploy code.WASM at ${config.contractAccount} and then initialize it
    `;

    deploy(a: CommandLineArgs) {
        const wasmFile = a.consumeString("wasmFile")

        a.optionalString("new") // can be omitted

        const initArgs = a.consumeJSON("init fn params")

        a.noMoreArgs()

        const nearCliArgs = [
            'deploy',
            config.contractAccount,
            wasmFile,
            "new", JSON.stringify(initArgs)
        ]

        nearCli.spawnNearCli(nearCliArgs, options)
    }

    ping_help = `
    Distributes rewards and restakes if needed.
    
    usage:
    > ${nickname} ping `;

    ping(a: CommandLineArgs) {
        a.noMoreArgs() // end of arguments

        this.call("ping")
    }

    get_accounts_help: string = `
    get registered accounts from the contract
    
    usage:
    > ${nickname} get_accounts { from_index:number, limit:number }
    
    example:
    > ${nickname} get_accounts { from_index:0, limit:10 }
    will get 10 accounts starting from 0
    `;

    get_accounts(a: CommandLineArgs) {
        const params = a.consumeJSON("{ from_index:number, limit:number }")

        a.noMoreArgs()

        return this.view("get_accounts", params)
    }

    deposit_help: string = `
    deposit into the contract for staking later
    
    usage:
    > ${nickname} deposit --attach Near-amount
    
    example:
    > ${nickname} deposit --attach 40N
    will deposit 40N on behalf of your account into the pool
    
    `;

    deposit(a: CommandLineArgs) {
        a.requireOptionWithAmount(options.amount, "N") // require --amount, in Nears

        a.noMoreArgs()

        this.call("deposit")
    }

    stake_help: string = `
stake deposited unstaked amount

usage:
> ${nickname} stake { amount: 10N }

example:
> ${nickname} stake { amount: 10N }
will stake 10N from the unstaked balance of myaccount.betanet 

`;

    stake(a: CommandLineArgs) {
        const stakeJSONargs = a.consumeJSON("{ amount: x }")

        a.noMoreArgs()

        this.call("stake", stakeJSONargs)
    }

    get_total_staked_balance(a: CommandLineArgs) {
        a.noMoreArgs()

        return this.view("get_total_staked_balance")
    }

    get_owner_id(a: CommandLineArgs) {
        a.noMoreArgs()

        return this.view("get_owner_id")
    }

    get_staking_key(a: CommandLineArgs) {
        a.noMoreArgs()

        return this.view("get_staking_key")
    }
}
