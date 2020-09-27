export const options = {

    contractName:{
        shortName: "c",
        valueType: "string",
        value:"${default-contract-name}", //default contract-accountId (where it's deployed)
        helpText: `sets the contract account ID`
    },

    accountId:{
        shortName: "acc",
        valueType: "string",
        value: "${default-user-accountId}", //default user accountId (signer)
        helpText: `user accountId, sets signer`
    },

    help: {
        shortName: "h",
        value:false,
    },

    info: {
        shortName: "i",
        value: false,
        helpText: 'show configured contract account, default user accountId',
    },

    verbose: {
        shortName: "v",
        helpText: 'Prints out verbose output',
        name: "verbose",

    },

    amount: {
        shortName: "am",
        valueType: "NEAR",
        value:"",
        helpText: `attach NEAR tokens to this call. Example: --amount 100N`

    },

    networkId:{
        shortName: "net",
        valueType: "string",
        value: "",
        helpText: 'NEAR network ID (default is NODE_ENV)',
    },


}

