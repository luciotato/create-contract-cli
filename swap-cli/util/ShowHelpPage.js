export function ShowHelpOptions(optionsDeclaration) {
    //show general options
    console.log();
    console.log("-".repeat(60));
    console.log("Options:");
    for (let key in optionsDeclaration) {
        let line = "";
        let opt = optionsDeclaration[key];
        let text = "--" + key;
        if (opt.valueType)
            text = text + " " + opt.valueType;
        if (opt.shortName) {
            text = text + ", -" + opt.shortName;
            if (opt.valueType)
                text = text + " " + opt.valueType;
        }
        line = `  ${text}`.padEnd(50) + (opt.helpText ? opt.helpText : "");
        console.log(line);
    }
    console.log("-".repeat(60));
}
export function ShowHelpPage(command, contractAPI, optionsDeclaration) {
    const commandsHelp = {};
    //check all functions in the ContractAPI class, except the class constructor
    const methodNames = Object.getOwnPropertyNames(contractAPI.__proto__)
        .filter(name => name !== "constructor" && (command === "" || name === command)); //filter requested command
    //populate commandsHelp
    methodNames.forEach((value) => commandsHelp[value] = "");
    //see which functions have proper help text
    //check all *_help string items in the ContractAPI class
    const properHelpStrings = Object.getOwnPropertyNames(contractAPI);
    for (const item of properHelpStrings) {
        if (item.endsWith("_help") && typeof contractAPI[item] === "string") {
            const method = item.replace("_help", "");
            if (command === "" || command == method) { //filter the requested help
                commandsHelp[method] = contractAPI[item]; //add proper help
            }
        }
    }
    //print all commands and their help if it's there
    for (const key in commandsHelp) {
        console.log("-".repeat(60));
        console.log('command: ' + key); //name the command
        console.log(commandsHelp[key]); //print the help
    }
    ShowHelpOptions(optionsDeclaration);
}
//# sourceMappingURL=ShowHelpPage.js.map