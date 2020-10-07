/**
 #Simple and minimum command line args parser
 *
 ##Functionalities:
 * * Rebuilds JSON object from severral CL args.
 *    --Note:  spaces *must* be used around { and }
 *

##Separates positional arguments from --options
-------------------------------
```
>mycontract transfer { account_id:luciotato, dest:otheraccount.betanet, stake:false } --amount 100N

result:
positional:
[
    {
     account_id:"luciotato",
     dest:"otheraccount.betanet",
     stake:false,
    }
]
options:
[
    "amount" : "100_000_000_000_000_000_000_000_000"
]
```

-----------------------------
## Planned funcionalities:
### parse [ ]
*/

import { sep } from "path" // host OS path separator
import { inspect } from "util"
import * as color from './color.js'

export type OptionDeclaration =
    {
        shortName: string
        valueType?: string
        helpText?: string
        value?: string|number|boolean
    }

// ----------------------------------------------------
// construct and show help page based on valid options
// ----------------------------------------------------
export function ShowHelpOptions(optionsDeclaration: Record<string,OptionDeclaration>) :void {
    // show help about declared options
    console.log()
    console.log("-".repeat(60))
    console.log("Options:")
    for (const key in optionsDeclaration) {
        let line = ""
        const opt = optionsDeclaration[key]
        let text = "--" + key
        if (opt.valueType) text = text + " " + opt.valueType
        if (opt.shortName) {
            text = text + ", -" + opt.shortName
            if (opt.valueType) text = text + " " + opt.valueType
        }
        line = `  ${text}`.padEnd(50) + (opt.helpText ? opt.helpText : "")
        console.log(line)
    }
    console.log("-".repeat(60))
}

// ----------------------------------------------------
// construct and show a help page based on the API for the commands
// ----------------------------------------------------
export function ShowHelpPage(command: string, contractAPI: Record<string,unknown>, optionsDeclaration: Record<string,OptionDeclaration>): void {
    const commandsHelp: Record<string,string> = {}

    // check all functions in the ContractAPI class, except the class constructor
    const methodNames =
        Object.getOwnPropertyNames(contractAPI.__proto__)
            .filter(name => name !== "constructor" && (command === "" || name === command)) // filter requested command

    // populate commandsHelp
    methodNames.forEach((value) => commandsHelp[value] = "")

    // see which functions have proper help text
    // check all *_help string items in the ContractAPI class
    const properHelpStrings = Object.getOwnPropertyNames(contractAPI)
    for (const item of properHelpStrings) {
        if (item.endsWith("_help") && typeof contractAPI[item] === "string") {
            const method = item.replace("_help", "")
            if (command === "" || command == method) { // filter the requested help
                commandsHelp[method] = contractAPI[item] as string // add proper help
            }
        }
    }
    // print all commands and their help if it's there
    for (const key in commandsHelp) {
        console.log("-".repeat(60))
        console.log('command: ' + key) // name the command
        console.log(commandsHelp[key]) // print the help
    }

    ShowHelpOptions(optionsDeclaration)
}

// --------------------------
// --  main exported class --
// --------------------------
export class CommandLineArgs {
    clArgs: string[] // initial list process.argv

    positional: (string | Record<string,unknown>)[] // string or JSON objects -- positional arguments

    optDeclarations: Record<string,OptionDeclaration>; // pointer to passed option declarations

    constructor(options: Record<string,OptionDeclaration>) {
        this.clArgs = process.argv
        this.optDeclarations = options
        this.positional = []

        // remove 'node' if called as a node script
        if (this.clArgs.length && (this.clArgs[0] === 'node' ||
            this.clArgs[0].endsWith(sep + 'node')) ||
            this.clArgs[0].endsWith(sep + 'node.exe')
        ) {
            this.clArgs = this.clArgs.slice(1)
        }

        // remove this script/executable name from command line arguments
        this.clArgs = this.clArgs.slice(1)

        // process each item separating options from posiitonal args

        // First: process --options
        for (const key in options) {
            const optionDecl = options[key]
            // search for option name & variations
            const pos = this.searchOption(optionDecl)
            if (pos >= 0) { // found in command line args
                const literal = this.clArgs[pos] // as written
                this.clArgs.splice(pos, 1) // remove from cl args

                if (optionDecl.valueType) { // has a value
                    if (pos >= this.clArgs.length) {
                        color.logErr("expecting value after " + literal)
                        process.exit(1)
                    }
                    const value = this.clArgs[pos] // take value
                    options[key].value = value // set value
                    this.clArgs.splice(pos, 1) // also remove value from list
                } else // valueless option
                {
                    options[key].value = true // set as present
                }
            }
        }

        // if at this point there are still --options in the command line args array, those are unknown options
        let hasErrors = false
        for (const item of this.clArgs) {
            if (item.startsWith("-")) {
                color.logErr("UNKNOWN option: " + item)
                hasErrors = true
            }
        }
        if (hasErrors) {
            ShowHelpOptions(options)
            process.exit(1)
        }

        // create consumible positional arguments, parsing also JSON command-line format
        for (let index = 0; index < this.clArgs.length; index++) {
            const item = this.clArgs[index]
            if (item == "{") { // a JSON object in the command line
                const extracted = this.extractJSONObject(index)
                this.positional.push(extracted.value)
                index = extracted.end
            } else {
                this.positional.push(item)
            }
        }
    }

    /**
     * When the first argument is the command to execute
     * returns "" if there's no arguments
     */
    getCommand():string {
        if (this.positional.length > 0 && typeof this.positional[0] !== "string") {
            color.logErr("expected a command as first argument'")
            process.exit(1)
        } else {
            if (this.positional.length === 0) return ""
            // take the first argument as this.command
            return this.positional.shift() as string
        }
    }

    /**
     * consume one string from the positional args
     * if it matches the expected string
     * returns false if the next arg doesn't match
     * @param which which string is expected
     */
    optionalString(which:string):boolean {
        if (this.positional.length == 0) return false

        if (typeof this.positional[0] !== "string") {
            color.logErr(`expected a string argument, got {... }`)
            process.exit(1)
        }
        if (this.positional[0] == which) {
            this.positional.shift() // consume
            return true
        }
        return false // not the expected string
    }

    /**
     * requires a string as the next positional argument
     * @param name
     */
    consumeString(name: string):string {
        if (this.positional.length == 0) {
            color.logErr(`expected '${name}' argument`)
            process.exit(1)
        }
        if (typeof this.positional[0] !== "string") {
            color.logErr(`expected ${name} string argument, got {... }`)
            process.exit(1)
        }
        return this.positional.shift() as string
    }

    /**
     * requires an amount in NEAR or YOCTO as the next positional argument
     * @param name
     */
    consumeAmount(name: string, units: "N"|"Y"|"I"|"F"): string|number {
        const value = this.consumeString(name)
        return this.convertAmount(value, units, name)
    }

    /**
     * requires a JSON as the next positional arg
     * @param name
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consumeJSON(name: string):any {
        if (this.positional.length == 0) {
            color.logErr(`expected ${name} as { }`)
            process.exit(1)
        }
        if (typeof this.positional[0] === "string") {
            color.logErr(`expected ${name} as {... } got a string: '${this.positional[0]}'`)
            process.exit(1)
        }
        return this.positional.shift() as Record<string,unknown>
    }

    /**
     * marks the end of the required arguments
     * if there are more arguments => error
     */
    noMoreArgs():void {
        if (this.positional.length) {
            color.logErr(`unrecognized extra arguments`)
            console.log(inspect(this.positional))
            process.exit(1)
        }
    }

    private findDeclarationKey(opt: OptionDeclaration) {
        for (const key in this.optDeclarations) {
            if (opt.shortName && this.optDeclarations[key].shortName == opt.shortName) return key
            if (opt.helpText && this.optDeclarations[key].helpText == opt.helpText) return key
        }
        throw new Error("shortName|helpText not found in declarations: " + inspect(opt))
    }

    /**
     * requires the presence of an option with a string value
     * @param optionName option name
     */
    requireOptionString(opt: OptionDeclaration): void {
        if (opt.value == undefined || opt.value == "" ) {
            const key = this.findDeclarationKey(opt)
            color.logErr(`required --${key}`)
            process.exit(1)
        }
    }

    /**
 * requires the presence of an option with an amount
 * @param optionName option name
 */
    requireOptionWithAmount(opt: OptionDeclaration, units: "N" | "Y"): void {
        const value: string = opt.value?.toString().trim()||""

        const key = this.findDeclarationKey(opt)
        if (!value) {
            color.logErr(`required --${key} [number]`)
            process.exit(1)
        }

        const converted = this.convertAmount(value, units, key)
        opt.value = converted // store in the required units
    }

    /**
     * search for the presence of an option
     * removes it from the options if found
     *
     * @param optionName option name
     */
    consumeOption(opt: OptionDeclaration): string {
        const value: string = opt.value as string

        if (value) { // found
            opt.value = undefined // remove from options (consume)
        }

        return value
    }

    /**
     * converts an argument from the command line into a numeric string expresed in the required units
     * example:
     * convertAmount("10N","N") => "10"
     * convertAmount("1.25N","Y") => "12500000000000000000000000"
     * convertAmount("1365465465464564654654Y","N") => "0.00000000001365465465464564654654"
     * convertAmount("100_000_000Y","Y") => "100000000"
     *
     * @param value string as read from the command line
     * @param requiredUnits N|Y unit in which the amount is required
     */
    convertAmount(value: string, requiredUnits: "N"|"Y"|"I"|"F", name:string): string|number {
        let result = value.toUpperCase()
        name = color.yellow + name + color.normal
        result = result.replace("_", "") // allow 100_000_000, ignore _

        if (result.endsWith("Y")) { // value ends in "Y"OCTOS
            if (result.includes(".")) {
                color.logErr(name + ": invalid amount format, YOCTOS can't have decimals: " + value)
                process.exit(1)
            }
            result = result.slice(0, -1) // remove Y
            if (requiredUnits == "Y") { return result } // already in Yoctos
            if (requiredUnits == "I"||requiredUnits == "F") { return Number(result) } // a js Number
            // NEARS required -- convert to NEARS
            if (result.length <= 24) {
                result = "0." + result.padStart(24, '0').slice(-24)
            } else {
                // insert decimal point at 1e24
                result = result.slice(0, result.length - 24) + "." + result.slice(-24)
            }
            return result
        } else { // other, assume amount in NEARS (default)
            if (!result.slice(-1).match(/\d|N|I|F/)) { //should end with N|I|F or a digit
                color.logErr(name + ": invalid denominator, expected Y|N|I|F => yoctos|near|int|float. Received:"  + result)
                process.exit(1)
            }
            if (result.endsWith("I")||result.endsWith("F")) {
                result = result.slice(0, -1) // remove denom, store as number
                return Number(result)
            }
            if (result.endsWith("N")) result = result.slice(0, -1) // remove N
            if (requiredUnits == "N") { return result } // already in Nears
            // Yoctos required -- convert to yoctos
            const parts = result.split(".")
            if (parts.length > 2) {
                color.logErr(name + ": invalid amount format, too many decimal points: " + value)
                process.exit(1)
            }
            if (parts.length == 1) { parts.push("") } // .0
            const decimalString = parts[1].padEnd(24, '0')
            result = parts[0] + "" + decimalString // +""+ is for making sure + means concat here
            return result
        }
    }

    /**
     * extract { a: b, d:100 } from the command line as a JSON object
     * @param start open brace position in this.list
     */
    private extractJSONObject(start: number) {
        // find the closing "}"
        let opened = 1
        let end = -1
        for (let n = start + 1; n < this.clArgs.length; n++) {
            const item = this.clArgs[n]
            if (item == "{") {
                opened++
            } else if (item == "}") {
                opened--
                if (opened == 0) {
                    end = n
                    break
                }
            }
        }

        if (end == -1) { // unmatched opener error
            color.logErr("Unmatched '{' . remember to put spaces around { and }")
            this.clArgs[start] = color.yellow + "{" + color.normal
            console.log(this.clArgs.join(" "))
            process.exit(1)
        }

        // Here we have start & end for matching { }
        const resultObj:Record<string,unknown> = {}
        for (let index = start + 1; index < end; index++) {
            let propName = this.clArgs[index]
            let propValue

            if (propName == ",") continue

            if ("{}".includes(propName)) {
                color.logErr("expected name:value")
                this.clArgs[index] = color.yellow + propName + color.normal
                console.log(this.clArgs.slice(start, end + 1).join(" "))
                process.exit(1)
            }

            const parts = propName.split(":")
            if (parts.length > 2) {
                color.logErr(` too many ':' (found ${parts.length - 1}) at ${propName}`)
                process.exit(1)
            }
            propName = parts[0]?.trim()
            propValue = parts[1]?.trim()

            if (propValue == undefined || propValue == "") {
                // let's assume the user typed "name: value" instead of "name:value"
                index++ // take the next arg
                propValue = this.clArgs[index]
                if (propValue.endsWith(":")) {
                    color.logErr(` missing value after ':' for ${propName}`)
                }
                if (index >= end || propValue == "}") {
                    console.log(`ERROR: expected value after ${propName}`)
                    process.exit(1)
                }
            }

            if (propValue == "{") { // subornidated object
                const subObj = this.extractJSONObject(index) // recursive***
                // store as object
                resultObj[propName] = subObj.value
                index = subObj.end // skip internal object
                continue
            }
            // it's a string
            // remove ending "," if it's there
            if (propValue.endsWith(",")) propValue = propValue.slice(0, propValue.length - 1)
            // check if it's a number
            if (propValue.toUpperCase().match(/^[0-9.]+[Y|N|I|F]{0,1}$/)) { // amount (optionally [Y|N|I|F] expressed in nears. yoctos, integer or float
                propValue = this.convertAmount(propValue, "Y", propName) // process and convert to Yoctos if expressed in nears
            }
            // store
            resultObj[propName] = propValue
        } // end for

        // return positions and composed object
        return { start: start, end: end, value: resultObj }
    }

    // ---------------------------
    /**
     * removes valueless options into the options object
     * returns true if the option was present
     * @param shortName short name, e.g -verb
     * @param fullName full name,e.g. --verbose
     */
    /*
    option(shortName: string, fullName: string) {

        //if .getPos(shortOption,argName) into var pos >= 0
        var pos = this.removeOption(shortName, fullName);
        if (pos >= 0) {
            this.positional.splice(pos, 1);
            return true;
        };
        return false;
    }
     */

    // ---------------------------
    /**
     * removes options that has a value after it
     * @param shortName short name, e.g -ata 100N
     * @param fullName full name,e.g. --attach 100N
     */
    /*
    valueFor(shortName: string, fullName: string) {

        var pos = this.removeOption(shortName, fullName);
        if (pos >= 0) { //found
            var value = this.positional[pos + 1]; //take value
            this.positional.splice(pos, 2);
            return value;
        };
        return undefined; //not found
    }
    */

    // ---------------------------
    /**
     * search for an option in the command line args, with variations
     * removes the option from the array
     * return position in the array where it was found|-1
     */
    private searchOption(option: OptionDeclaration): number {
        const name = this.findDeclarationKey(option)
        const shortName = option.shortName

        // search several possible forms of the option, e.g. -o --o -outdir --outdir
        const variants = ['-' + name, '--' + name]
        if (shortName) { variants.push('--' + shortName, '-' + shortName) }

        // for each item in list
        for (const variant of variants) {
            const inx = this.clArgs.indexOf(variant)
            if (inx >= 0) {
                return inx // found
            }
        }
        return -1// not found
    }
}
// end class CommandLineArgs
