"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.thsep = exports.lastNumber = exports.view = exports.call = exports.spawnNearCli = exports.yton = exports.decodeHTMLEntities = exports.setDebug = void 0;
const child_process = require("child_process");
let debug = 0;
function setDebug(value) { debug = value; }
exports.setDebug = setDebug;
function decodeHTMLEntities(str) {
    str = str.replace(/&#(\d+);/g, function (match, dec) {
        return String.fromCharCode(dec);
    });
    str = str.replace(/&#(x[A-F0-9]+);/g, function (match, dec) {
        return String.fromCharCode(parseInt("0" + dec));
    });
    return str.replace(/&quot;/g, "'");
}
exports.decodeHTMLEntities = decodeHTMLEntities;
function yton(yoctos) {
    let units = yoctos;
    if (units.length < 25)
        units = units.padStart(25, '0');
    units = units.slice(0, -24) + "." + units.slice(-24);
    return units;
}
exports.yton = yton;
function spawnNearCli(args, options) {
    var _a;
    //remove empty args
    let inx = 0;
    while (inx < args.length)
        if (args[inx] == undefined)
            args.splice(inx, 1);
        else
            inx++;
    // add options to args for near-cli
    // for each option
    for (const key in options) {
        const opt = options[key];
        const value = opt.value;
        if (value) { // if it was set
            args.push("--" + key); // add option presence
            if (opt.valueType) { // if the option included a value
                args.push(opt.value); // add option value
            }
        }
    }
    // -----------------------------
    // near-cli uses NODE_ENV to define --networkId
    // -----------------------------
    // get process.env, clone the actual env vars
    const env = Object.create(process.env);
    const pos = args.indexOf("--networkId");
    if (pos >= 0) {
        const network = args[pos + 1];
        env.NODE_ENV = network;
        console.log(`NODE_ENV=${network}`);
    }
    // -----------------------------
    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] !== "string") { // JSON
            args[i] = JSON.stringify(args[i]);
            args[i] = args[i].replace(/"/g, '\\"'); // add escape before each quote
        }
    }
    if (debug || ((_a = options.verbose) === null || _a === void 0 ? void 0 : _a.value))
        console.log(`near ${args.join(" ")}`);
    const execResult = child_process.spawnSync("near", args, { shell: true, env: env }); // shell:true => to be able to invoke near-cli on windows
    // console.log(execResult.stdout.toString())
    // console.log(execResult.stderr.toString())
    if (execResult.error) {
        console.log(execResult.error);
        process.exit(1);
    }
    let stdo = "";
    if (execResult.stdout) {
        // console.log("stdout:")
        // console.log("-*-")
        // fixes for  near-cli output
        stdo = decodeHTMLEntities(execResult.stdout.toString());
        process.stdout.write(stdo);
        // console.log("-*-")
    }
    if (execResult.stderr) {
        // console.log("stderr:")
        // console.log("-*-")
        process.stdout.write(decodeHTMLEntities(execResult.stderr.toString()));
        // console.log("-*-")
    }
    // show numbers in yoctos converted to more readable units
    // get all numbers where number.lenght>=20
    const numbersFound = stdo.replace(/'/g, " ").replace(/"/g, " ").match(/.*?['" ]\d{14,50}/g);
    if (numbersFound) {
        // deduplicate
        const numbers = [...new Set(numbersFound)];
        // show conversion to NEARs
        console.log("amounts denomination:");
        for (const text of numbers) {
            const parts = text.split(" ");
            const num = parts.pop() || "";
            if (num.length >= 20) {
                // show reference line
                console.log(text.padStart(60, ' ').slice(-60) + " Yoctos => " + yton(num).padStart(38, ' '));
            }
        }
    }
    if (execResult.status != 0) {
        process.exit(execResult.status);
    }
    return stdo;
}
exports.spawnNearCli = spawnNearCli;
// -------------------------------------
// extension helper fns at ContractAPI
// -------------------------------------
function nearCli(cv, contract, command, fnJSONparams, options) {
    const nearCliArgs = [
        cv,
        contract,
        command,
        fnJSONparams
    ];
    return spawnNearCli(nearCliArgs, options);
}
// --------------------- call  contract
function call(contract, command, fnJSONparams, options) {
    return nearCli("call", contract, command, fnJSONparams, options);
}
exports.call = call;
// --------------------- view on contract
function view(contract, command, fnJSONparams, options) {
    return nearCli("view", contract, command, fnJSONparams, options);
}
exports.view = view;
// format output helper functions
// get single number output on a near view call
function lastNumber(stdo) {
    if (!stdo)
        return "";
    const items = stdo.split("\n");
    if (items.length < 2)
        return "";
    return items[items.length - 2].replace(/'/g, "");
}
exports.lastNumber = lastNumber;
// formats a large amount adding _ as thousands separator
function thsep(stdonum) {
    if (stdonum && stdonum.length > 3) {
        for (let n = stdonum.length - 3; n >= 1; n -= 3) {
            stdonum = stdonum.slice(0, n) + "_" + stdonum.slice(n);
        }
    }
    return stdonum;
}
exports.thsep = thsep;
//# sourceMappingURL=SpawnNearCli.js.map