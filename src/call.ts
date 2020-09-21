import * as child_process from "child_process";
var util = require("util");
var fs = require("fs");

function spawn(args: string[]) {  

    if (exp.DEBUG >= 2) console.log(args);

    console.log("near " + args.join(" "));
    var execResult = child_process.spawnSync("near", args);

    //console.log(execResult.stdout.toString())
    //console.log(execResult.stderr.toString())

    // if (exp.DEBUG >= 2) {
        if (execResult.output[0]) console.log("output[0]:"+execResult.output[0].toString());
         if (execResult.stdout) {
             console.log("stdout <<-*-")
             console.log(execResult.stdout.toString());
             console.log("-*-")
         }
         if (execResult.stderr) {
             console.log("stderr <<-*-");
             console.log(execResult.stderr.toString());
             console.log("-*-")
         }
    // }

    if (execResult.status != 0) {
        throw new Error("Failed to run successfully, exit status: " + execResult.status);
    }

    return execResult.stdout;
}

var exp = { DEBUG: 2 }
var fnArgs
var argscall: string[]

let bufferOutput;

var a = process.argv
const command = a[2]
switch (command) {


    case "deploy": {

        fnArgs = {
            owner_id: "luciotato.betanet",
            stake_public_key: "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
            reward_fee_fraction: { numerator: 5, denominator: 100 }
        }

        argscall = ['deploy',
            'testcontract.betanet',
            "rust-staking-pool.wasm",
            "new",
            JSON.stringify(fnArgs)
        ]
        bufferOutput = spawn(argscall);
        break;
    }

    case "info": {

        argscall = ['view',
            'testcontract.betanet',
            "get_total_staked_balance"
        ]
        bufferOutput = spawn(argscall);

        argscall = ['view',
            'testcontract.betanet',
            "get_owner_id"
        ]
        bufferOutput = spawn(argscall);

        argscall = ['view',
            'testcontract.betanet',
            "get_staking_key"
        ]
        bufferOutput = spawn(argscall);

        break;
    }

    case "get_accounts": {

        fnArgs = {
            from_index: 0,
            limit: 10,
        }

        argscall = ['view',
            //'testcontract.betanet',
            'luckystaker.stakehouse.betanet',
            "get_accounts",
            JSON.stringify(fnArgs)
        ]
        bufferOutput = spawn(argscall);
        break;
    }

    case "deposit": {

        argscall = ['call',
            'testcontract.betanet',
            "deposit",
            "--networkId", "betanet",
            "--accountId","testuser.betanet",
            "--amount", a[3]
        ]
        bufferOutput = spawn(argscall);
        break;
    }

    default: {
        console.log("invalid command " + a[2])
    }
}

//near deploy testcontract.betanet rust - staking - pool.wasm new "{\"owner_id:\"luciotato.betanet\", stake_public_key:\"11\", reward_fee_fraction:{numerator:5,denominator:100}}" 1000000000000 0.1

//if (exp.DEBUG >= 2) console.log(argscall);

//if (exp.DEBUG >= 1) console.log(context)
//if (exp.DEBUG >= 1) console.log("input State")
//if (exp.DEBUG >= 1) console.log(contractAccount.state)



var result = bufferOutput.toString()
console.log(result)

if (command == "get_accounts") {
    const start = result.indexOf("[")
    var j =[]
    eval("j = "+result.slice(start))
    for (var i of j) {
        console.log(i)
    }
}
//console.log(bufferOutput.toString())

