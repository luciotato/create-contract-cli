const child_process= require("child_process");

let debug = 0
module.exports.setDebug=function(value /*:0|1|2*/) /*:void*/ { debug = value }

function decodeHTMLEntities (str) {
    str = str.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec)
    })
    str = str.replace(/&#(x[A-F0-9]+);/g, function(match, dec) {
        return String.fromCharCode(parseInt("0" + dec))
    })
    return str.replace(/&quot;/g, "'")
}
module.exports.decodeHTMLEntities=decodeHTMLEntities;

function yton(yoctos/*:string*/)/*:string*/ {
    let units = yoctos
    if (units.length < 25) units = units.padStart(25, '0')
    units = units.slice(0, -24) + "." + units.slice(-24)
    return units
}
module.exports.yton=yton

function spawnNearCli(args /*:(string|any)[]*/, options /*:any*/) /*:string*/ {
    
    //remove empty args
    let inx=0
    while(inx<args.length) if (args[inx]==undefined) args.splice(inx,1); else inx++;
    
    // add options to args for near-cli
    // for each option
    for (const key in options) {
        const opt = options[key]
        const value = opt.value
        if (value) { // if it was set
            args.push("--" + key) // add option presence
            if (opt.valueType) { // if the option included a value
                args.push(opt.value) // add option value
            }
        }
    }

    // -----------------------------
    // near-cli uses NODE_ENV to define --networkId
    // -----------------------------
    // get process.env, clone the actual env vars
    const env = Object.create(process.env)
    const pos = args.indexOf("--networkId")
    if (pos >= 0) {
        const network = args[pos + 1]
        env.NODE_ENV = network
        console.log(`NODE_ENV=${network}`)
    }
    // -----------------------------

    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] !== "string") { // JSON
            args[i] = JSON.stringify(args[i])
            args[i] = args[i].replace(/"/g, '\\"') // add escape before each quote
        }
    }

    if (debug || options.verbose || options.verbose.value) console.log(`near ${args.join(" ")}`)
    const execResult = child_process.spawnSync("near", args, { shell: true, env: env }) // shell:true => to be able to invoke near-cli on windows

    // console.log(execResult.stdout.toString())
    // console.log(execResult.stderr.toString())

    if (execResult.error) {
        console.log(execResult.error)
        process.exit(1)
    }
    let stdo = ""
    if (execResult.stdout) {
        // console.log("stdout:")
        // console.log("-*-")
        // fixes for  near-cli output
        stdo = decodeHTMLEntities(execResult.stdout.toString())
        process.stdout.write(stdo)
        // console.log("-*-")
    }
    if (execResult.stderr) {
        // console.log("stderr:")
        // console.log("-*-")
        process.stdout.write(decodeHTMLEntities(execResult.stderr.toString()))
        // console.log("-*-")
    }

    // show numbers in yoctos converted to more readable units
    // get all numbers where number.lenght>=20
    const numbersFound = stdo.replace(/'/g," ").replace(/"/g," ").match(/.*?['" ]\d{14,50}/g)
    if (numbersFound) {
        // deduplicate
        const numbers = [...new Set(numbersFound)]
        // show conversion to NEARs
        console.log("amounts denomination:")
        for (const text of numbers) {
            const parts=text.split(" ")
            const num=parts.pop()||""
            if (num.length >= 20) {
                // show reference line
                console.log(text.padStart(60, ' ').slice(-60) + " Yoctos => " + yton(num).padStart(38, ' '))
            }
        }
    }

    if (execResult.status != 0) {
        process.exit(execResult.status)
    }

    return stdo
}
module.exports.spawnNearCli = spawnNearCli

// -------------------------------------
// extension helper fns at ContractAPI
// -------------------------------------
function nearCli(cv /*:"call"|"view"*/, contract, command, fnJSONparams, options) {
    const nearCliArgs = [
        cv,
        contract,
        command,
        fnJSONparams
    ]
    return spawnNearCli(nearCliArgs, options)
}
// --------------------- call  contract
module.exports.call=function(contract, command, fnJSONparams, options) {
    return nearCli("call", contract, command, fnJSONparams, options)
}
// --------------------- view on contract
module.exports.view=function(contract, command, fnJSONparams, options) {
    return nearCli("view", contract, command, fnJSONparams, options)
}

// format output helper functions
// get single number output on a near view call
module.exports.lastNumber=function(stdo) {
    if (!stdo) return ""
    const items = stdo.split("\n")
    if (items.length < 2) return ""
    return items[items.length - 2].replace(/'/g, "")
}

// formats a large amount adding _ as thousands separator
module.exports.thsep=function(stdonum) {
    if (stdonum && stdonum.length > 3) {
        for (let n = stdonum.length - 3; n >= 1; n -= 3) {
            stdonum = stdonum.slice(0, n) + "_" + stdonum.slice(n)
        }
    }
    return stdonum
}
