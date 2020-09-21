import { spawnNearCli } from "./util/SpawnNearCli"
import { CommandLineArgs } from "./util/CommandLineArgs"
import { commonCliOptions } from "./util/CommonCLIOptions";

//name of this script
export const NickName = "tom" //"lucky"
//account id where this contrat is deployed
export const defaultContractName = "testcontract.betanet" //"luckystaker.stakehouse.betanet"

//one function for each pub fn in the contract
//get parameters by consuming from CommandLineParser
export class ContractAPI {

    deploy_help: string = `
    deploy a WASM file into the account ${defaultContractName} and call init function

    usage:
    > ${NickName} deploy [--account xx] code.WASM new { owner_id:string, stake_public_key:string, reward_fee_fraction: { numerator:x, denominator:y } }
    
    example:
    > ${NickName} deploy code.WASM new { owner_id:luciotato.betanet, stake_public_key:"7fac387409283934", reward_fee_fraction: { numerator:8, denominator:100 } }
    willl deploy code.WASM at ${defaultContractName} and then initialize it
    `;

    deploy(a: CommandLineArgs) {

        const contract = a.consumeOption(commonCliOptions.contractName) || defaultContractName

        const wasmFile = a.consumeString("wasmFile")

        const initArgs = a.consumeJSON("init fn params")

        a.noMoreArgs()

        const nearCliArgs = [
            'deploy',
            contract,
            wasmFile,
            "new", JSON.stringify(initArgs)
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);

    }

    get_accounts_help: string = `
        get registered accounts from the contract

        usage:
        > ${NickName} get_accounts { from_index:number, limit:number }

        example:
        > ${NickName} get_accounts { from_index:0, limit:10 }
        will get 10 accounts starting from 0
    `;
    get_accounts(a: CommandLineArgs) {

        const contract = a.consumeOption(commonCliOptions.contractName) || defaultContractName

        const params = a.consumeJSON("{ from_index:number, limit:number }")

        a.noMoreArgs()

        const nearCliArgs = [
            'view',
            contract,
            "get_accounts",
            JSON.stringify(params)
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);

    }

    deposit_help: string = `
        deposit into the contract for staking later
        
        usage:
        > ${NickName} deposit --accountId myaccount.betanet --attach Near-amount
    
        example:
        > ${NickName} deposit --accountId myaccount.betanet --attach 40N
        will deposit 40N on behalf of myaccount.betanet into the pool

    `;
    deposit(a: CommandLineArgs) {

        const contract = a.consumeOption(commonCliOptions.contractName) || defaultContractName

        a.requireOptionString(commonCliOptions.accountId); //require accountId

        a.requireOptionAmount(commonCliOptions.amount, "N"); //require --amount, in Nears

        a.noMoreArgs()

        const nearCliArgs = ['call',
            contract,
            "deposit",
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    //function depo: example manually coded composed/aternative command
    depo_help: string = `
        shotcut for deposit
        
        usage:
        > ${NickName} depo amountN myaccount.betanet [and] [stake]
    
        example:
        > ${NickName} depo 40N myaccount.betanet 
        will deposit 40N on behalf of myaccount.betanet into ${NickName}'s pool
        > ${NickName} depo 40N myaccount.betanet anf stake
        will deposit 40N on behalf of myaccount.betanet into ${NickName}'s pool and stake it in the same transaction

    `;
    depo(a: CommandLineArgs) {

        const contract = a.consumeOption(commonCliOptions.contractName) || defaultContractName

        const amount = a.consumeAmount("amount to deposit", "N");

        const account = a.consumeString("accountId");

        //check if [and] [stake] is next in the command line
        a.optionalString("and")
        let stake=a.optionalString("stake")

        const fnToCall = stake? "deposit_and_stake" : "deposit"

        a.noMoreArgs()

        const nearCliArgs = ['call',
            contract,
            fnToCall,
            "--accountId", account,
            "--amount", amount
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    get_total_staked_balance(a: CommandLineArgs) {

        const contract = a.consumeOption(commonCliOptions.contractName) || defaultContractName

        a.noMoreArgs()

        const nearCliArgs = [
            'view',
            contract,
            "get_total_staked_balance"
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    get_owner_id(a: CommandLineArgs) {

        const contract = a.consumeOption(commonCliOptions.contractName) || defaultContractName

        a.noMoreArgs()

        const nearCliArgs = [
            'view',
            contract,
            "get_owner_id"
        ]

        a.addOptionsTo(nearCliArgs); //add any other --options found the command line

        spawnNearCli(nearCliArgs);
    }

    get_staking_key(a: CommandLineArgs) {

        const contract = a.consumeOption(commonCliOptions.contractName) || defaultContractName

        a.noMoreArgs()

        const nearCliArgs = [
            'view',
            contract,
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

