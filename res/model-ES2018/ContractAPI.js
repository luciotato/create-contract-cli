const color = require("./util/color.js")
const nearCli = require("./util/SpawnNearCli.js");
const options = require("./CLIOptions.js");
const cliConfig = require("./CLIConfig.js")

const nickname = cliConfig.nickname

// one function for each pub fn in the contract
// get parameters by consuming from CommandLineParser
class ContractAPI {

    // this.view helper function
    _view(command/*:string*/, fnJSONParams/*?:any*/) /*:string*/ {
        return nearCli.view(cliConfig.contractAccount, command, fnJSONParams, options)
    }
    // this.call helper function
    _call(command/*:string*/, fnJSONParams/*?:any*/) /*:string*/ {
        return nearCli.call(cliConfig.contractAccount, command, fnJSONParams, options)
    }

    ping_HELP() { return  `
    Distributes rewards and restakes if needed.
    
    usage:
    > ${nickname} ping `};

    ping(a /*:CommandLineArgs*/ ) /*:void*/{
        a.noMoreArgs() // end of arguments
        this._call("ping")
    }

    get_accounts_HELP() { return  `
    get registered accounts from the contract
    
    usage:
    > ${nickname} get_accounts { from_index:number, limit:number }
    
    example:
    > ${nickname} get_accounts { from_index:0, limit:10 }
    will get 10 accounts starting from 0
    `;}

    get_accounts(a /*:CommandLineArgs*/ ) {
        const params = a.consumeJSON("{ from_index:number, limit:number }")
        a.noMoreArgs()
        return this._view("get_accounts", params)
    }

    deposit_HELP() { return  `
    deposit into the contract for staking later
    
    usage:
    > ${nickname} deposit --attach Near-amount
    
    example:
    > ${nickname} deposit --attach 40N
    will deposit 40N on behalf of your account into the pool
    
    `}

    deposit(a /*:CommandLineArgs*/ ) /*:void*/{
        a.requireOptionWithAmount(options.amount, "N") // require --amount, in Nears
        a.noMoreArgs()
        this._call("deposit")
    }

    stake_HELP() { return  `
    stake deposited unstaked amount

    usage:
    > ${nickname} stake { amount: 10N }

    example:
    > ${nickname} stake { amount: 10N }
    will stake 10N from the unstaked balance of myaccount.betanet 

    `}

    stake(a /*:CommandLineArgs*/ ) /*:void*/{
        const stakeJSONargs = a.consumeJSON("{ amount: x }")
        a.noMoreArgs()
        this._call("stake", stakeJSONargs)
    }

    get_total_staked_balance(a /*:CommandLineArgs*/ ) /*:string*/ {
        a.noMoreArgs()

        return this._view("get_total_staked_balance")
    }

    get_owner_id(a /*:CommandLineArgs*/ ) /*:string*/ {
        a.noMoreArgs()

        return this._view("get_owner_id")
    }

    get_staking_key(a /*:CommandLineArgs*/ ) /*:string*/ {
        a.noMoreArgs()

        return this._view("get_staking_key")
    }
}

module.exports = ContractAPI;
