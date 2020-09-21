"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawn_near_cli = void 0;
const child_process = require("child_process");
var util = require("util");
var fs = require("fs");
function spawn_near_cli(args) {
    //if (exp.DEBUG >= 2) console.log(args);
    console.log("near " + args.join(" "));
    var execResult = child_process.spawnSync("near", args);
    //console.log(execResult.stdout.toString())
    //console.log(execResult.stderr.toString())
    // if (exp.DEBUG >= 2) {
    if (execResult.output[0])
        console.log("output[0]:" + execResult.output[0].toString());
    if (execResult.stdout) {
        console.log("stdout <<-*-");
        console.log(execResult.stdout.toString());
        console.log("-*-");
    }
    if (execResult.stderr) {
        console.log("stderr <<-*-");
        console.log(execResult.stderr.toString());
        console.log("-*-");
    }
    // }
    if (execResult.status != 0) {
        throw new Error("Failed to run successfully, exit status: " + execResult.status);
    }
    return execResult.stdout;
}
exports.spawn_near_cli = spawn_near_cli;
//# sourceMappingURL=spawn-near-cli.js.map