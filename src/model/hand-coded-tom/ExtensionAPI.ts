#!/bin/node
import { config } from "./config.js"
import { ContractAPI, nickname } from "./ContractAPI.js"
import { options } from "./CLIOptions.js"
import { CommandLineArgs, ShowHelpPage } from "./util/CommandLineArgs.js"
import * as color from "./util/color.js"
import * as nearCli from "./util/SpawnNearCli.js"

// -------------------------
// Contract API extensions
// -------------------------
export class ExtensionAPI extends ContractAPI {
    // hm handy extension
    hm_help = `How much? 
	converts an amount in Yoctos into a more readable format. 
    Example: 
    >nearswap hm 30037100000000000000000000
    `
    hm(a: CommandLineArgs) {
        const str = a.consumeString("amount")
        console.log(a.convertAmount(str + "Y", "N", "amount"))
        process.exit(0)
    }

    // -----------------------------------------------
    // -----------------------------------------------
    // You can add more commands to this cli here
    // -----------------------------------------------
    // -----------------------------------------------

    // -----------------------------------------------
    // info Example extension
    // -----------------------------------------------
    myfn_help = `This is a command extension example wiht variable args. 
	Handy commands you can create composing fn calls to this contract or others

	Usage:
	>tom myfn [account]+
    `
    myfn(a: CommandLineArgs) {
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

    // -----------------------------------------------
    // NEP21 Example extension
    // -----------------------------------------------
    nep21_help = `Call functions on NEP21 contracts.
    Examples:
    >tom nep21 balance gold.nep21.near         -> get how much gold this contract has
    >tom nep21 balance my gold.nep21.near      -> get how much gold you have
    >tom nep21 mint mytoken.near               -> (dev) calls mytoken.near.mint(), minting tokens for you

    >nearswap nep21 transfer 50 gold.near to lucio.testnet  -> transfer 50e24 gold.near tokens to account lucio.testnet

`
    nep21(a: CommandLineArgs) {
        const subcommand = a.consumeString("sub-command")

        if (subcommand == "balance") {
            let tokenOwner = config.contractAccount
            if (a.optionalString("my")) tokenOwner = config.userAccount

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
            if (toAcc == "contract") toAcc = config.contractAccount // this contract

            nearCli.call(token, "transfer", { new_owner_id: toAcc, amount: tokAmount }, options)
        } else {
            console.log("nep21 UNK subcommand " + color.red + subcommand + color.normal)
            process.exit(1)
        }

        process.exit(0)
    }

    // function depo: example manually coded composed/aternative command
    depo_help: string = `
    shotcut for deposit

    usage:
    > ${nickname} depo amountN [and] [stake]

    example:
    > ${nickname} depo 40N 
    will deposit 40N on into ${nickname}'s pool
    > ${nickname} depo 40N and stake
    will deposit 40N into ${nickname}'s pool and stake it in the same transaction

    `;

    depo(a: CommandLineArgs) {
        options.amount.value = a.consumeAmount("amount to deposit", "N")

        // check if [and] [stake] is next in the command line
        a.optionalString("and")
        const stake = a.optionalString("stake")

        const fnToCall = stake ? "deposit_and_stake" : "deposit"

        a.noMoreArgs()

        return this.call(fnToCall)
    }

    // function info: example manually coded composed command

    info_help = "get_owner_id, get_staking_key & get_total_staked_balance"

    info(a: CommandLineArgs) {
        this.get_owner_id(a)
        this.get_staking_key(a)
        this.get_total_staked_balance(a)
    }
}
