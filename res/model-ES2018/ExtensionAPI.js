const color = require("./util/color.js")
const nearCli = require("./util/SpawnNearCli.js");
const options = require("./CLIOptions.js");
const cliConfig = require("./CLIConfig.js")
const ContractAPI = require("./ContractAPI.js")
const CommandLineArgs = require("./util/CommandLineArgs.js")

const nickname = cliConfig.nickname

// -------------------------
// Contract API extensions
// -------------------------
class ExtensionAPI extends ContractAPI {

    // hm handy extension example
    hm_HELP(){ return `
    How much? 
	converts an amount in Yoctos into a more readable format. 
    
    Example: 
    >${nickname} hm 30037100000000000000000000
    `}

    hm(a /*:CommandLineArgs*/)  {
        const str = a.consumeString("amount")
        console.log(color.green,a.convertAmount(str + "Y", "N", "amount"),color.normal)
    }

    // where extension example
    where_HELP(){ return `
    Where is the contract? 
    shows contract accountId, this is an Example extension, gives the same information as: ${nickname} --info
    
    Usage:
    >${nickname} where [are] [you]
    `}
    where(a /*:CommandLineArgs*/) /*:void*/ {
        a.optionalString("are")
        a.optionalString("you")
        a.noMoreArgs()
        console.log("Contract is at ",color.green,cliConfig.contractAccount,color.normal)
        console.log("Default user is ",color.green,cliConfig.userAccount,color.normal)
    }

    // balance extension example
    state_HELP(){ return `
    Get contract's account state, with more readable numbers
    
    Usage:
    >${nickname} state
    `}

    state(a /*:CommandLineArgs*/) /*:void*/ {
        a.noMoreArgs()
        nearCli.spawnNearCli(["state", cliConfig.contractAccount], options)
    }

    // deploy extension example
    deploy_HELP(){ return `
    deploy a WASM file into the account ${cliConfig.contractAccount} 
    
    usage:
    > ${nickname} deploy /path/to/code.WASM
    
    example:
    > ${nickname} deploy myCode.WASM
    willl deploy code.WASM at ${cliConfig.contractAccount} 
    `;}

    deploy(a /*:CommandLineArgs*/) /*:void*/ {
        //get path from command line
        const wasmFile = a.consumeString("path/to/contract.wasm")
        //spawn near-cli, command=deploy
        nearCli.spawnNearCli(["deploy", cliConfig.contractAccount, wasmFile], options);
    }


    // -----------------------------------------------
    // -----------------------------------------------
    // You can add more extension commands here
    // -----------------------------------------------
    // -----------------------------------------------

    // -----------------------------------------------
    // info Example extension
    // -----------------------------------------------
    /*
    myfn_HELP(){ return `
    This is a command extension example wiht variable args. 
	Handy commands you can create composing fn calls to this contract or others

	Usage:
	>${nickname} myfn [account]+
    `}

    myfn(a) {
        if (a.positional.length == 0) {
            this.view("myfn", {}) // call myfn on this contract
        } else {
            while (a.positional.length) {
                const account = a.consumeString("another account")
                nearCli.view(account, "myfn", {}, options) // call myfn on one or mode accounts
            }
        }
        process.exit(0)
    }
    */

    // -----------------------------------------------
    // NEP21 Example extension
    // -----------------------------------------------
    /*
    nep21_HELP(){ return `
    Call functions on NEP21 contracts.
    Examples:
    >>${nickname} nep21 balance gold.nep21.near         -> get how much gold this contract has
    >>${nickname} nep21 balance my gold.nep21.near      -> get how much gold you have
    >>${nickname} nep21 mint mytoken.near               -> (dev) calls mytoken.near.mint(), minting tokens for you

    >${nickname} nep21 transfer 50 gold.near to lucio.testnet  -> transfer 50e24 gold.near tokens to account lucio.testnet

    `}
    nep21(a) {
        const subcommand = a.consumeString("sub-command")

        if (subcommand == "balance") {
            let tokenOwner = cliConfig.contractAccount
            if (a.optionalString("my")) tokenOwner = cliConfig.userAccount

            while (a.positional.length) {
                const token = a.consumeString("nep21-contract")
                nearCli.view(token, "get_balance", { owner_id: tokenOwner }, options)
            }
        } else if (subcommand == "mint") {
            const token = a.consumeString("nep21-contract")
            nearCli.call(token, "mint_1e3", {}, options)
        }

        // nearswap nep21 transfer 50000 gold to lucio.testnet
        else if (subcommand == "transfer") {
            const tokAmount = a.consumeAmount("token amount", "Y")

            const token = a.consumeString("nep21-contract")

            a.optionalString("to")

            let toAcc = a.consumeString("to account")
            if (toAcc == "contract") toAcc = cliConfig.contractAccount // this contract

            nearCli.call(token, "transfer", { new_owner_id: toAcc, amount: tokAmount }, options)
        } else {
            console.log("nep21 UNK subcommand " + color.red + subcommand + color.normal)
            process.exit(1)
        }

        process.exit(0)
    }
    */

    /*
    // function depo: example manually coded composed/aternative command
    depo_HELP(){return `
    shotcut for deposit

    usage:
    > ${nickname} depo amountN [and] [stake]

    example:
    > ${nickname} depo 40N 
    will deposit 40N on into ${nickname}'s pool
    > ${nickname} depo 40N and stake
    will deposit 40N into ${nickname}'s pool and stake it in the same transaction
    `}

    depo(a) { //a:CommandLineArgs
        options.amount.value = a.consumeAmount("amount to deposit", "N")

        // check if [and] [stake] is next in the command line
        a.optionalString("and")
        const stake = a.optionalString("stake")

        const fnToCall = stake ? "deposit_and_stake" : "deposit"

        a.noMoreArgs()

        return this.call(fnToCall)
    }
    */

    // function info: example manually coded composed command
    /*
    info_HELP(){ return `
    get_owner_id, get_staking_key & get_total_staked_balance
    `}

    info(a) { //a:CommandLineArgs
        this.get_owner_id(a)
        this.get_staking_key(a)
        this.get_total_staked_balance(a)
    }
    */

}

module.exports = ExtensionAPI
