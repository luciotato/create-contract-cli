"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractAPI = exports.defaultContractName = exports.NickName = void 0;
const SpawnNearCli_1 = require("./util/SpawnNearCli");
const CommonCLIOptions_1 = require("./util/CommonCLIOptions");
//name of this script
exports.NickName = "tom"; //"lucky"
//account id where this contrat is deployed
exports.defaultContractName = "testcontract.betanet"; //"luckystaker.stakehouse.betanet"
//one function for each pub fn in the contract
//get parameters by consuming from CommandLineParser
class ContractAPI {
    constructor() {
        this.deploy_help = `
    deploy a WASM file into the account ${exports.defaultContractName} and call init function

    usage:
    > ${exports.NickName} deploy [--account xx] code.WASM new { owner_id:string, stake_public_key:string, reward_fee_fraction: { numerator:x, denominator:y } }
    
    example:
    > ${exports.NickName} deploy code.WASM new { owner_id:luciotato.betanet, stake_public_key:"7fac387409283934", reward_fee_fraction: { numerator:8, denominator:100 } }
    willl deploy code.WASM at ${exports.defaultContractName} and then initialize it
    `;
        this.get_accounts_help = `
        get registered accounts from the contract

        usage:
        > ${exports.NickName} get_accounts { from_index:number, limit:number }

        example:
        > ${exports.NickName} get_accounts { from_index:0, limit:10 }
        will get 10 accounts starting from 0
    `;
        this.deposit_help = `
        deposit into the contract for staking later
        
        usage:
        > ${exports.NickName} deposit --accountId myaccount.betanet --attach Near-amount
    
        example:
        > ${exports.NickName} deposit --accountId myaccount.betanet --attach 40N
        will deposit 40N on behalf of myaccount.betanet into the pool

    `;
        //function depo: example manually coded composed/aternative command
        this.depo_help = `
        shotcut for deposit
        
        usage:
        > ${exports.NickName} depo amountN myaccount.betanet [and] [stake]
    
        example:
        > ${exports.NickName} depo 40N myaccount.betanet 
        will deposit 40N on behalf of myaccount.betanet into ${exports.NickName}'s pool
        > ${exports.NickName} depo 40N myaccount.betanet anf stake
        will deposit 40N on behalf of myaccount.betanet into ${exports.NickName}'s pool and stake it in the same transaction

    `;
    }
    deploy(a) {
        const contract = a.consumeOption(CommonCLIOptions_1.commonCliOptions.contractName) || exports.defaultContractName;
        const wasmFile = a.consumeString("wasmFile");
        const initArgs = a.consumeJSON("init fn params");
        a.noMoreArgs();
        const nearCliArgs = [
            'deploy',
            contract,
            wasmFile,
            "new", JSON.stringify(initArgs)
        ];
        a.addOptionsTo(nearCliArgs); //add any other --options found the command line
        SpawnNearCli_1.spawnNearCli(nearCliArgs);
    }
    get_accounts(a) {
        const contract = a.consumeOption(CommonCLIOptions_1.commonCliOptions.contractName) || exports.defaultContractName;
        const params = a.consumeJSON("{ from_index:number, limit:number }");
        a.noMoreArgs();
        const nearCliArgs = ['view',
            contract,
            "get_accounts",
            JSON.stringify(params)
        ];
        a.addOptionsTo(nearCliArgs); //add any other --options found the command line
        SpawnNearCli_1.spawnNearCli(nearCliArgs);
    }
    deposit(a) {
        const contract = a.consumeOption(CommonCLIOptions_1.commonCliOptions.contractName) || exports.defaultContractName;
        a.requireOptionString(CommonCLIOptions_1.commonCliOptions.accountId); //require accountId
        a.requireOptionAmount(CommonCLIOptions_1.commonCliOptions.amount, "N"); //require --amount, in Nears
        a.noMoreArgs();
        const nearCliArgs = ['call',
            contract,
            "deposit",
        ];
        a.addOptionsTo(nearCliArgs); //add any other --options found the command line
        SpawnNearCli_1.spawnNearCli(nearCliArgs);
    }
    depo(a) {
        const contract = a.consumeOption(CommonCLIOptions_1.commonCliOptions.contractName) || exports.defaultContractName;
        const amount = a.consumeAmount("amount to deposit", "N");
        const account = a.consumeString("accountId");
        //check if [and] [stake] is next in the command line
        a.optionalString("and");
        let stake = a.optionalString("stake");
        const fnToCall = stake ? "deposit_and_stake" : "deposit";
        a.noMoreArgs();
        const nearCliArgs = ['call',
            contract,
            fnToCall,
            "--accountId", account,
            "--amount", amount
        ];
        a.addOptionsTo(nearCliArgs); //add any other --options found the command line
        SpawnNearCli_1.spawnNearCli(nearCliArgs);
    }
    get_total_staked_balance(a) {
        const contract = a.consumeOption(CommonCLIOptions_1.commonCliOptions.contractName) || exports.defaultContractName;
        a.noMoreArgs();
        const nearCliArgs = [
            'view',
            contract,
            "get_total_staked_balance"
        ];
        a.addOptionsTo(nearCliArgs); //add any other --options found the command line
        SpawnNearCli_1.spawnNearCli(nearCliArgs);
    }
    get_owner_id(a) {
        const contract = a.consumeOption(CommonCLIOptions_1.commonCliOptions.contractName) || exports.defaultContractName;
        a.noMoreArgs();
        const nearCliArgs = [
            'view',
            contract,
            "get_owner_id"
        ];
        a.addOptionsTo(nearCliArgs); //add any other --options found the command line
        SpawnNearCli_1.spawnNearCli(nearCliArgs);
    }
    get_staking_key(a) {
        const contract = a.consumeOption(CommonCLIOptions_1.commonCliOptions.contractName) || exports.defaultContractName;
        a.noMoreArgs();
        const nearCliArgs = [
            'view',
            contract,
            "get_staking_key"
        ];
        a.addOptionsTo(nearCliArgs); //add any other --options found the command line
        SpawnNearCli_1.spawnNearCli(nearCliArgs);
    }
    //function info: example manually coded composed command
    info(a) {
        this.get_owner_id(a);
        this.get_staking_key(a);
        this.get_total_staked_balance(a);
    }
}
exports.ContractAPI = ContractAPI;
//# sourceMappingURL=ContractAPI.js.map