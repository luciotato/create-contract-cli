"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonCliOptions = void 0;
exports.commonCliOptions = {
    verbose: {
        name: "verbose",
        shortName: "v",
    },
    help: {
        name: "help",
        shortName: "h",
    },
    networkId: {
        name: "networkId",
        shortName: "net",
        valueType: "string",
    },
    accountId: {
        name: "accountId",
        shortName: "acc",
        valueType: "string",
        helpText: `user accountId, sets signer`
    },
    contractName: {
        name: "contractName",
        shortName: "c",
        valueType: "string",
        helpText: `sets the contract account ID`
    },
    amount: {
        name: "amount",
        shortName: "am",
        valueType: "NEAR",
        helpText: `attach NEAR tokens to this call. Example: --amount 100N`
    },
};
//# sourceMappingURL=CommonCLIOptions.js.map