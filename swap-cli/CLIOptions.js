export const options = {
    help: {
        shortName: "h",
        value: false
    },
    verbose: {
        shortName: "v",
        helpText: 'Prints out verbose output',
        name: "verbose"
    },
    amount: {
        shortName: "am",
        valueType: "NEAR",
        value: 0,
        helpText: `attach NEAR tokens to this call. Example: --amount 100N`
    },
    networkId: {
        shortName: "net",
        valueType: "string",
        value: "",
        helpText: 'NEAR network ID (default is NODE_ENV)'
    },
    accountId: {
        shortName: "acc",
        valueType: "string",
        value: "",
        helpText: `user accountId, sets signer`
    },
    contractName: {
        shortName: "c",
        valueType: "string",
        value: "",
        helpText: `sets the contract account ID`
    }
}
// # sourceMappingURL=CLIOptions.js.map
