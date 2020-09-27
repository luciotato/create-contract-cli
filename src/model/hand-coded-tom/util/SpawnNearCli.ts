import * as child_process from "child_process";
import * as util from "util"
import * as fs from "fs"

let debug = 0
export function setDebug(value: 0 | 1 | 2) { debug = value }

export function spawnNearCli(args: string[]) {

    //-----------------------------
    // near-cli uses NODE_ENV to define --networkId 
    //-----------------------------
    // get process.env, clone the actual env vars 
    var env = Object.create(process.env);
    const pos = args.indexOf("--networkId")
    if (pos >= 0) {
        const network = args[pos + 1]
        env.NODE_ENV = network;
        console.log(`NODE_ENV=${network}`);
    }
    //-----------------------------

    for (var i = 0; i < args.length; i++) {
        //(windows-compat)
        if (typeof args[i] != "string") { //JSON
            args[i] = JSON.stringify(args[i])
            args[i] = args[i].replace(/"/g, '\\"') //add escape before each quote (windows-compat)
        }
    }

    console.log(`near ${args.join(" ")}`);
    var execResult = child_process.spawnSync("near", args, { shell: true, env: env }); // shell:true => to be able to invoke near-cli on windows

    //console.log(execResult.stdout.toString())
    //console.log(execResult.stderr.toString())

    if (execResult.error) {
        console.log(execResult.error)
        process.exit(1)
    }


    if (execResult.stdout) {
        //console.log("stdout:")
        //console.log("-*-")
        process.stdout.write(execResult.stdout)
        //console.log("-*-")
        //show large numbers converted to near
        //get all numbers where number.lenght>=20
        let numbersFound = execResult.stdout.toString().match(/\d+/g)
        if (numbersFound) {
            let largeNumbers = numbersFound.filter((value) => value.length >= 20)
            if (largeNumbers.length) {
                //deduplicate
                let numbers = [...new Set(largeNumbers)]
                //show conversion to NEARs
                console.log("numbers reference:")
                for (let num of numbers) {
                    if (num.length >= 20) {
                        let near = num;
                        if (near.length < 25) near = near.padStart(25, '0');
                        near = near.slice(0, near.length - 24) + "." + near.slice(near.length - 24) + " NEAR"
                        //show reference line
                        console.log(num.padStart(36, ' ') + " => " + near.padStart(38, ' '))
                    }
                }
            }
        }

    }
    if (execResult.stderr) {
        //console.log("stderr:")
        //console.log("-*-")
        process.stdout.write(execResult.stderr)
        //console.log("-*-")
    }

    if (execResult.status != 0) {
        process.exit(execResult.status as number);
    }

    return execResult.stdout;
}
