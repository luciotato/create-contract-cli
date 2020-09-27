import { spawnNearCli } from "./util/SpawnNearCli.js"
import { CommandLineArgs } from "./util/CommandLineArgs.js"
import { options } from "./CLIOptions.js"

//name of this script
export const nickname = "tom"
//account id where this contrat is deployed
export const defaultContractName = options.contractName.value
//your account id -- default signer, default accountId parameter
export const defaultUserAccountId = options.accountId.value

//one function for each pub fn in the contract
//get parameters by consuming from CommandLineParser
export class ContractAPI {

    deploy_help = `
    deploy a WASM file into the account ${defaultContractName} and call init function
    
    usage:
    > ${nickname} deploy [--account xx] code.WASM new { owner_id:string, stake_public_key:string, reward_fee_fraction: { numerator:x, denominator:y } }
    
    example:
    > ${nickname} deploy code.WASM new { owner_id:lucio.near, stake_public_key:"7fa387483934", reward_fee_fraction: { numerator:8, denominator:100 } }
    willl deploy code.WASM at ${defaultContractName} and then initialize it
    `;

    deploy(a: CommandLineArgs) {

        const wasmFile = a.consumeString("wasmFile")

        a.optionalString("new") //can be omitted

        const initArgs = a.consumeJSON("init fn params")

        a.noMoreArgs()

        const nearCliArgs = [
            'deploy',
            options.contractName.value,
            wasmFile,
            "new", JSON.stringify(initArgs)
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);

    }

    ping_help = `
    Distributes rewards and restakes if needed.
    
    usage:
    > tom ping `;

    ping(a: CommandLineArgs) {

        a.noMoreArgs() //end of arguments

        const nearCliArgs = [
            "call",
            options.contractName.value,
            "ping",
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);

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

        const nearCliArgs = [
            'view',
            options.contractName.value,
            "get_accounts",
            JSON.stringify(params)
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);

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

        a.requireOptionWithAmount(options.amount, "N"); //require --amount, in Nears

        a.noMoreArgs()

        const nearCliArgs = ['call',
            options.contractName.value,
            "deposit",
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
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

        const nearCliArgs = [
            'call',
            options.contractName.value,
            "stake",
            stakeJSONargs,
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    //function depo: example manually coded composed/aternative command
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

        options.amount.value = a.consumeAmount("amount to deposit", "N");

        //check if [and] [stake] is next in the command line
        a.optionalString("and")
        let stake = a.optionalString("stake")

        const fnToCall = stake ? "deposit_and_stake" : "deposit"

        a.noMoreArgs()

        const nearCliArgs = ['call',
            options.contractName.value,
            fnToCall
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    get_total_staked_balance(a: CommandLineArgs) {

        a.noMoreArgs()

        const nearCliArgs = [
            'view',
            options.contractName.value,
            "get_total_staked_balance"
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    get_owner_id(a: CommandLineArgs) {

        a.noMoreArgs()

        const nearCliArgs = [
            'view',
            options.contractName.value,
            "get_owner_id"
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    get_staking_key(a: CommandLineArgs) {

        a.noMoreArgs()

        const nearCliArgs = [
            'view',
            options.contractName.value,
            "get_staking_key"
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    //function info: example manually coded composed command
    info(a: CommandLineArgs) {
        this.get_owner_id(a)
        this.get_staking_key(a)
        this.get_total_staked_balance(a)
    }

}

