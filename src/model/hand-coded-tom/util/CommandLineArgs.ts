/**
 #Simple and minimun command line args parser
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

import { sep } from "path"; //host OS path separator
import { inspect } from "util";

export type OptionDeclaration =
    {
        name: string;
        shortName: string;
        valueType?: string;
        helpText?: string
    }

export class CommandLineArgs {

    clArgs: string[] //initial list process.argv

    positional: (string | {})[] //string or JSON objects -- positional arguments

    public options: any; // options. e.g.:  --its-on  -o  --amount 100N

    public command: string;

    constructor(optionsDeclaration: any) {

        this.clArgs = process.argv
        this.options = {}
        this.positional = []

        //remove 'node' if called as a node script
        if (this.clArgs.length && (this.clArgs[0] === 'node'
            || this.clArgs[0].endsWith(sep + 'node'))
            || this.clArgs[0].endsWith(sep + 'node.exe')
        ) {
            this.clArgs = this.clArgs.slice(1);
        };

        //remove this script/executable name from command line arguments
        this.clArgs = this.clArgs.slice(1);

        if (this.clArgs.length === 0) { //no command => --help
            this.options.help = true;
            this.command = ""
            return
        }

        //process each item separating options from posiitonal args

        //First: process --options 
        for (const key in optionsDeclaration) {
            const optionDecl = optionsDeclaration[key]
            //search for option name & variations 
            const pos = this.searchOption(optionDecl)
            if (pos >= 0) { //found in command line args

                const literal = this.clArgs[pos]; //as written
                this.clArgs.splice(pos, 1); //remove from cl args

                if (optionDecl.valueType) { //has a value
                    if (pos >= this.clArgs.length) {
                        console.log("expecting value after " + literal)
                        process.exit(1)
                    }
                    const value = this.clArgs[pos]; //take value
                    this.options[optionDecl.name] = value //set value
                    this.clArgs.splice(pos, 1); //also remove value from list
                }
                else //valueless option 
                {
                    this.options[optionDecl.name] = true //set as present 
                }
            }
        }

        //if at this point there are still --opt or -opt in the command line args, those are unknown options
        let hasErrors = false
        for (const item of this.clArgs) {
            if (item.startsWith("-")) {
                console.log("UNKNOWN option: " + item)
                hasErrors = true
            }
        }
        if (hasErrors) process.exit(1);

        //create consumible positional arguments, processing JSON command-line format
        for (let index = 0; index < this.clArgs.length; index++) {
            const item = this.clArgs[index]
            if (item == "{") { //a JSON object in the command line
                const extracted = this.extractJSONObject(index)
                this.positional.push(extracted.value)
                index = extracted.end
            }
            else {
                this.positional.push(item)
            }
        }

        //command is the 1st positional argument
        //special case, no command => "--help"
        if (this.positional.length === 0) {
            this.options.help = true;
            this.command = ""
        }
        else if (this.positional.length > 0 && typeof this.positional[0] !== "string") {
            console.log("ERROR: expected a command as first argument'")
            process.exit(1)
        }
        else {
            //take the first argument
            this.command = this.positional.shift() as string
        }
    }

    /**
     * consume one string from the positional args
     * if it matches the expected string
     * returns false if the next arg doesn't match
     * @param which which string is expected
     */
    optionalString(which:string) {
        
        if (this.positional.length == 0) return false;

        if (typeof this.positional[0] != "string") {
            console.log(`ERROR: expected a string argument, got {... }`)
            process.exit(1)
        }
        if (this.positional[0]==which) {
            this.positional.shift() //consume
            return true
        }
        return false //not the expected string
    }

    /**
     * requires a string as the next positional argument
     * @param name
     */
    consumeString(name: string) {
        if (this.positional.length == 0) {
            console.log(`ERROR: expected ${name}' argument`)
            process.exit(1)
        }
        if (typeof this.positional[0] != "string") {
            console.log(`ERROR: expected ${name} string argument, got {... }`)
            process.exit(1)
        }
        return this.positional.shift() as string
    }

    /**
     * requires an amount in NEAR or YOCTO as the next positional argument
     * @param name
     */
    consumeAmount(name: string, units: "N" | "Y"): string {
        let value = this.consumeString(name)
        return this.convertAmount(value, units)
    }

    /**
     * requires a JSON as the next positional arg
     * @param name 
     */
    consumeJSON(name: string) {
        if (this.positional.length == 0) {
            console.log(`ERROR: expected ${name} as { }`)
            process.exit(1)
        }
        if (typeof this.positional[0] == "string") {
            console.log(`ERROR: expected ${name} as {... } got a string: '${this.positional[0]}'`)
            process.exit(1)
        }
        return this.positional.shift() as any
    }

    /**
     * marks the end of the required arguments
     * if there are more arguments => error
     */
    noMoreArgs() {
        if (this.positional.length) {
            console.log(`ERROR: unrecognized extra arguments`)
            console.log(inspect(this.positional))
            process.exit(1)
        }
    }

    /**
     * requires the presence of an option with an amount
     * @param optionName option name
     */
    requireOptionString(option: OptionDeclaration): void {

        let value: string = this.options[option.name].toString().trim()

        if (value == undefined || value == "") {
            console.log(`ERROR: required --${option.name}`)
            process.exit(1)
        }

        this.options[option.name] = value; //store trimmed
    }

    /**
 * requires the presence of an option with an amount
 * @param optionName option name
 */
    requireOptionWithAmount(option: OptionDeclaration, units: "N" | "Y"): void {

        let value: string = this.options[option.name].toString().trim()

        if (value == undefined || value == "") {
            console.log(`ERROR: required --${option.name}`)
            process.exit(1)
        }

        const converted = this.convertAmount(value, units);
        this.options[option.name] = converted; //store in the required units

    }

    /**
     * search for the presence of an option 
     * removes it from the options if found
     * 
     * @param optionName option name
     */
    consumeOption(option: OptionDeclaration, defaultValue?: string): string {

        let value: string = this.options[option.name]

        if (value) { //found
            this.options[option.name] = undefined; //remove from options (consume)
        }

        return value
    }

    /**
     * add options found in command line to nearCliArgs for near-cli
     * @param nearCliArgs prepared array for nearCliArgs, normally containing view|call contractName fn {args}
     */
    addOptionsTo(nearCliArgs: string[]) {

        //for each option 
        for (let key in this.options) {
            const value=this.options[key]
            if (value) { //if it was set
                nearCliArgs.push("--" + key) //add option presence 
                if (typeof value!='boolean') { //if the option included a value 
                    nearCliArgs.push(this.options[key]) //add option value
                }
            }
        }

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
    convertAmount(value: string, requiredUnits: "N" | "Y") {

        let result: string

        if (value.length > 1 && value.endsWith("N")) { //NEARS
            result = value.slice(0, -1) //remove N
            result = result.replace("_", "") //allow 100_000_000, ignore _
            if (requiredUnits == "N") return result; //already in Nears

            //Yoctos required -- convert to yoctos
            let parts = value.split(".")
            if (parts.length > 2) {
                console.log("ERROR: invalid amount format, too many decimal points: " + value)
                process.exit(1)
            }
            let decimalString = parts[1].padEnd(24, '0')
            result = parts[0] + "" + decimalString // +""+ is for making sure + means concat here
            return result

        }
        else if (value.length > 1 && value.endsWith("Y")) { //YOCTOS

            if (value.includes(".")) {
                console.log("ERROR: invalid amount format, YOCTOS can't have decimals: " + value)
                process.exit(1)
            }

            result = value.slice(0, -1) // remove Y
            result = result.replace("_", "") //allow 100_000_000, ignore _
            if (requiredUnits == "Y") return result; //already in Yoctos

            //NEARS required -- convert to NEARS
            if (result.length <= 24) {
                result = "0." + result.padStart(24, '0').slice(-24)
            }
            else {
                //insert decimal point at 1e24
                result = result.slice(0, result.length - 24) + "." + result.slice(-24)
            }
            return result
        }
        else {
            console.log("ERROR: invalid amount format, expecting [0-9.](Y|N). Received: " + value)
            console.log("valid examples are: 0.5N | 100N | 100_000_000Y")
            process.exit(1)
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
                opened++;
            }
            else if (item == "}") {
                opened--;
                if (opened == 0) {
                    end = n;
                    break;
                }
            }
        }

        if (end == -1) { //unmatched opener error
            console.log("ERROR: Unmatched '{' . remember to put spaces around { and }")
            this.clArgs[start] = "**{**"
            console.log(this.clArgs.join(" "))
            process.exit(1)
        }

        //Here we have start & end for matching { }
        let resultObj:any = {}
        for (let index = start + 1; index < end; index++) {
            let propName = this.clArgs[index];
            let propValue = undefined

            if (propName == ",") continue;

            if ("{}".includes(propName)) {
                console.log("ERROR: expected name:value")
                this.clArgs[index] = `**${propName}**`
                console.log(this.clArgs.slice(start, end+1).join(" "))
                process.exit(1)
            }

            let parts = propName.split(":")
            propName = parts[0]?.trim()
            propValue = parts[1]?.trim()

            if (propValue == undefined || propValue == "") {
                //let's assume the user typed "name: value" instead of "name:value"
                index++ //take the next arg
                propValue = this.clArgs[index]
                if (index>=end || propValue=="}"){
                    console.log(`ERROR: expected value after ${propName}`)
                    process.exit(1)
                }
            }

            if (propValue == "{") { //subornidated object
                const subObj = this.extractJSONObject(index) //recursive***
                //store as object
                resultObj[propName] = subObj.value
                index = subObj.end //skip internal object
                continue;
            }
            //it's a string
            //remove ending "," if it's there
            if (propValue.endsWith(",")) propValue = propValue.slice(0, propValue.length - 1)
            //check if it's a js-compatible number
            if (propValue.length<=15 && propValue.match(/^[0-9_\.]*$/)) { //it's a js number
                resultObj[propName] = Number(propValue.replace("_", "")) //store as number
                continue;
            }
            //store as string
            resultObj[propName] = propValue

        } //end for

        //return positions and composed object
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

        let name = option.name
        let shortName = option.shortName

        //search several possible forms of the option, e.g. -o --o -outdir --outdir
        var variants = ['-' + name, '--' + name];
        if (shortName) { variants.push('--' + shortName, '-' + shortName) };

        //for each item in list
        for(const variant of variants){
            var inx = this.clArgs.indexOf(variant);
            if (inx >= 0) {
                return inx //found
            }
        }
        return -1;//not found
    }

}
// end class CommandLineArgs
