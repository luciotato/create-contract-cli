module.exports = {

    accountId: {
        shortName: "acc",
        valueType: "string",
        value: "",
        helpText: `signer accountId`
    },

    masterAccount: {
        shortName: "ma",
        valueType: "string",
        value: "",
        helpText: `master account`
    },

    help: {
        shortName: "h",
        value: false
    },

    info: {
        shortName: "i",
        value: false,
        helpText: 'show configured contract account, default user accountId'
    },

    verbose: {
        shortName: "v",
        helpText: 'Prints out verbose output',
        name: "verbose"
    },

    amount: {
        shortName: "am",
        valueType: "NEAR",
        value: "",
        helpText: `attach NEAR tokens to this call. Example: --amount 100N`

    },
    networkId: {
        shortName: "net",
        valueType: "string",
        value: "",
        helpText: 'NEAR network ID (default is NODE_ENV)'
    },

    contractName: {
        shortName: "c",
        valueType: "string",
        value: "",
        helpText: `sets the contract accountId for near deploy and --cliConfig`
    },

    cliConfig: {
        shortName: "cliconf",
        value: false,
        helpText: `config this cli, you must include --contractName xx and --accountId yy to set default contract accountId and user`
    },
}
