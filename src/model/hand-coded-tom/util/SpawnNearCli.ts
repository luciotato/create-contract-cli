import * as child_process from "child_process";
import * as util from "util"
import * as fs from "fs"

let debug = 0
export function setDebug(value: 0 | 1 | 2) { debug = value }

export function spawnNearCli(args: string[]) {
    
    //-----------------------------
    //as of today 2020/09/19 near-cli seems to be ignoring --networkId 
    // and won't work unless you set NODE_ENV
    // this is a workround for that problem
    //-----------------------------
    // get process.env, clone the actual env vars 
    var env = Object.create( process.env );
    const pos=args.indexOf("--networkId")
    if (pos>=0) {
        const network=args[pos+1]
        env.NODE_ENV = network;
        console.log(`NODE_ENV=${network}`);
    }
    //-----------------------------
    
    console.log(`near ${args.join(" ")}`);
    var execResult = child_process.spawnSync("near", args, {shell:true, env:env}); // shell:true => to be able to invoke near-cli on windows
    
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
            let largeNumbers = numbersFound.filter((value)=>value.length>=20)
            //deduplicate
            let numbers=[...new Set(largeNumbers)]
            //show conversion to NEARs
            for (let num of numbers) {
                if (num.length >= 20) {
                    let near = num;
                    if (near.length < 25) near = near.padStart(25,'0');
                    near = near.slice(0, near.length - 24) + "." + near.slice(near.length - 24) + " NEAR"
                    //show reference line
                    console.log(num.padStart(36, ' ') + " => " + near.padStart(38, ' '))
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
    //}
    
    if (execResult.status != 0) {
        process.exit(execResult.status as number);
    }
    
    return execResult.stdout;
}
