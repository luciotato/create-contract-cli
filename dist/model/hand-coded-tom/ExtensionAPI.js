#!/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionAPI = void 0;
const CLIConfig_js_1 = require("./CLIConfig.js");
const ContractAPI_js_1 = require("./ContractAPI.js");
const CLIOptions_js_1 = require("./CLIOptions.js");
const color = require("./util/color.js");
const nearCli = require("./util/SpawnNearCli.js");
// -------------------------
// Contract API extensions
// -------------------------
class ExtensionAPI extends ContractAPI_js_1.ContractAPI {
    constructor() {
        super(...arguments);
        // hm handy extension example
        this.hm_help = `How much? 
	converts an amount in Yoctos into a more readable format. 
    Example: 
    >${ContractAPI_js_1.nickname} hm 30037100000000000000000000
    `;
        // where extension example
        this.where_help = `Where is the contract? 
    show contract accountId
    Example extension, gives the same information as: ${ContractAPI_js_1.nickname} --info
    
    Usage:
    >${ContractAPI_js_1.nickname} where [are] [you]
    `;
        // balance extension example
        this.state_help = `
    Get contract's account state, with more readable numbers
    
    Usage:
    >${ContractAPI_js_1.nickname} state
    `;
        // deploy extension example
        this.deploy_help = `call near deploy on ${CLIConfig_js_1.cliConfig.contractAccount} 
    Example: 
    >${ContractAPI_js_1.nickname} deploy path/to/wasm
    `;
        // -----------------------------------------------
        // -----------------------------------------------
        // You can add more extension commands here
        // -----------------------------------------------
        // -----------------------------------------------
        // -----------------------------------------------
        // info Example extension
        // -----------------------------------------------
        /*
        myfn_help = `This is a command extension example wiht variable args.
        Handy commands you can create composing fn calls to this contract or others
    
        Usage:
        >${nickname} myfn [account]+
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
        */
        // -----------------------------------------------
        // NEP21 Example extension
        // -----------------------------------------------
        /*
        nep21_help = `Call functions on NEP21 contracts.
        Examples:
        >>${nickname} nep21 balance gold.nep21.near         -> get how much gold this contract has
        >>${nickname} nep21 balance my gold.nep21.near      -> get how much gold you have
        >>${nickname} nep21 mint mytoken.near               -> (dev) calls mytoken.near.mint(), minting tokens for you
    
        >${nickname} nep21 transfer 50 gold.near to lucio.testnet  -> transfer 50e24 gold.near tokens to account lucio.testnet
    
    `
        nep21(a: CommandLineArgs) {
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
        */
        // function info: example manually coded composed command
        /*
        info_help = "get_owner_id, get_staking_key & get_total_staked_balance"
    
        info(a: CommandLineArgs) {
            this.get_owner_id(a)
            this.get_staking_key(a)
            this.get_total_staked_balance(a)
        }
        */
    }
    hm(a) {
        const str = a.consumeString("amount");
        console.log(color.green, a.convertAmount(str + "Y", "N", "amount"), color.normal);
    }
    where(a) {
        a.optionalString("are");
        a.optionalString("you");
        a.noMoreArgs();
        console.log("Contract is at ", color.green, CLIConfig_js_1.cliConfig.contractAccount, color.normal);
        console.log("Default user is ", color.green, CLIConfig_js_1.cliConfig.userAccount, color.normal);
    }
    state(a) {
        a.noMoreArgs();
        nearCli.spawnNearCli(["state", CLIConfig_js_1.cliConfig.contractAccount], CLIOptions_js_1.options);
    }
    deploy(a) {
        //get path from command line
        const wasmFile = a.consumeString("path/to/contract.wasm");
        //spawn near-cli, command=deploy
        nearCli.spawnNearCli(["deploy", wasmFile], CLIOptions_js_1.options);
    }
}
exports.ExtensionAPI = ExtensionAPI;
//# sourceMappingURL=ExtensionAPI.js.map