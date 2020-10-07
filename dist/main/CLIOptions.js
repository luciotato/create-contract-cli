export const options = {
    contractName: {
        shortName: "c",
        helpText: `AccountId where the contract is deployed`,
        valueType: "string",
        value: ""
    },
    accountId: {
        shortName: "acc",
        valueType: "string",
        value: "",
        helpText: `default user accountId, sets signer`
    },
    help: {
        shortName: "h",
        value: false
    },
    verbose: {
        shortName: "v",
        helpText: 'Prints out verbose output',
        value: false
    },
    networkId: {
        shortName: "net",
        helpText: 'default NEAR network ID for the cli-tool being created (defaults to NODE_ENV)',
        valueType: "string",
        value: ""
    },
    output: {
        shortName: "o",
        valueType: "string",
        helpText: `output path (Default .)`,
        value: "."
    },
    nolink: {
        shortName: "nl",
        helpText: `do not run npm link after creation`,
        value: false
    }
};
//# sourceMappingURL=CLIOptions.js.map