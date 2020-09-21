import { CommandLineArgs, OptionDeclaration } from "./CommandLineArgs";

export function ShowHelpPage(contractAPI:any, optionsDeclaration:any) {

    let commandsHelp={}

    //check all functions in the ContractAPI class, except the class constructor
    let methodNames = Object.getOwnPropertyNames(contractAPI.__proto__).filter(name => name!="constructor")
    //populate commandsHelp
    methodNames.forEach((value)=>commandsHelp[value]="")

    //see which functions have proper help text
    //check all *_help string items in the ContractAPI class
    const properHelpStrings = Object.getOwnPropertyNames(contractAPI)
    for (let item of properHelpStrings) {
        if (item.endsWith("_help") && typeof contractAPI[item]=="string") {
            const method = item.replace("_help","")
            commandsHelp[method] = contractAPI[item] as string //add proper help
        }
    }
    //print all commands and their help if it's there
    for (const key in commandsHelp) {
        console.log("-".repeat(60));
        console.log('command: '+key); //name the command
        console.log(commandsHelp[key]); //print the help
    }

    //show general options
    console.log("-".repeat(60))
    console.log("Options")
    console.log("-".repeat(60))
    for (let key in optionsDeclaration) {
        let line=""
        let opt=optionsDeclaration[key]
        let name = opt.name
        if (opt.valueType) name=name+" "+opt.valueType
        let sname = opt.shortName
        if (opt.valueType) sname=sname+" "+opt.valueType

        line=`${name}, ${sname}${' '.repeat(40)}`.slice(0,40) + (opt.helpText? opt.helpText:"")
        console.log(line)
    }
    console.log("-".repeat(60))
}

