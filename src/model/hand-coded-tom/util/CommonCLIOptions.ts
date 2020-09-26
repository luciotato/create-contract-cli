export const commonCliOptions = {

    help: {
        name: "help",
        shortName: "h",
    },

    verbose: {
        name: "verbose",
        shortName: "v",
        helpText: 'Prints out verbose output',
    },

    amount: {
        name: "amount",
        shortName: "am",
        valueType: "NEAR",
        helpText: `attach NEAR tokens to this call. Example: --amount 100N`
    },

    networkId:{
        name: "networkId",
        shortName: "net",
        valueType: "string",
        helpText: 'NEAR network ID, allows using different keys based on network',
    },

    accountId:{
        name: "accountId",
        shortName: "acc",
        valueType: "string",
        helpText: `user accountId, sets signer`
    },

    contractName:{
        name: "contractName",
        shortName: "c",
        valueType: "string",
        helpText: `sets the contract account ID`
    },

}

