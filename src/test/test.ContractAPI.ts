import * as path from "path"
import * as mkPath from "../lib/util/mkPath.js"
import * as logger from "../lib/util/logger.js"
import * as color from '../lib/util/color.js'
import { readFileSync } from "fs"
import { Parser } from "../lib/Parser/Parser.js"
import { ContractAPIProducer as Producer } from "../main/ContractAPI-producer"
import { spawn } from "child_process"

const TESTNAME = "ContractAPI Producer"

type dataInfo = {
    nickname: string;
    defaultContractName: string;
}

export function testFor(rustFile: string, expectedFile:string, data: dataInfo) : void {
    console.log("Testing " + TESTNAME)

    // parse
    let parsedModule
    try {
        const parser = new Parser({skipFunctionBody:true})
        // parse rust lib file
        parsedModule = parser.parseFile(rustFile)
    } catch (ex) {
        console.log(color.red + ex.message + color.normal)
        console.log(ex)
        console.log(process.cwd())
        console.log("Error parsing " + parsedModule?.name)
        throw (ex)
    }

    console.log("parsed ok: " + parsedModule?.name)

    const outPath = "out"
    mkPath.create(outPath)

    console.log("writing temp files in " + path.join(process.cwd(), outPath))

    const generatedFile = path.join(outPath, data.nickname + "-API.js")

    // produce
    try {
        Producer.produce(parsedModule, data, generatedFile)
    } catch (ex) {
        console.log(ex)
        console.log("Error producing " + parsedModule?.name)
        throw (ex)
    }

    const generated = readFileSync(generatedFile)

    const expected = readFileSync(expectedFile)

    if (generated.toString() !== expected.toString()) {
        console.log(color.red + "FAILED " + color.normal)
        console.log("generated: " + generatedFile)
        console.log("expected: " + expectedFile)
        const compareCommand="meld " + generatedFile + " " + expectedFile
        console.log(" > "+compareCommand)
        spawn("meld",[generatedFile,expectedFile])
    } else {
        console.log(TESTNAME + " Test " + color.green + "OK" + color.normal)
    }
}

export function testContractAPIProducer() : void{
    logger.setDebugLevel(0)
    //logger.setDebugRange(1490,1800)

    testFor('./res/test/rust/div-pool/src/lib.rs', "./res/test/expected/div-pool-API.js",
        { nickname: "div", defaultContractName: "diversifying.pools.guildnet" }
    )

    logger.setDebugLevel(0)
    //logger.setDebugRange(1450,1500)


    //testFor('./res/test/rust/NEARSwap/src/lib.rs', "./res/test/expected/swap-API.js",
    //    { nickname: "swap", defaultContractName: "near-clp.betanet" }
    //)

    // logger.setDebugLevel(0)
    //logger.setDebugRange(1450,1500)

    testFor('./res/test/rust/staking-pool/src/lib.rs', "./res/test/expected/staking-pool-API.js",
        { nickname: "staky", defaultContractName: "tomstaker.stakehouse.betanet" }
    )

    // logger.setDebugLevel(0)
    //logger.setDebugRange(1450,1500)

    testFor('./res/test/rust/lockup/src/lib.rs', "./res/test/expected/lockup-API.js",
        { nickname: "lockup", defaultContractName: "testcontract.testnet" }
    )

    testFor('./res/test/rust/multisig/src/lib.rs', "./res/test/expected/multisig-API.js",
        { nickname: "multisig", defaultContractName: "testcontract.testnet" }
    )

    testFor('./res/test/rust/staking-pool-factory/src/lib.rs', "./res/test/expected/factory-API.js",
        { nickname: "factory", defaultContractName: "testcontract.testnet" }
    )

    testFor('./res/test/rust/voting/src/lib.rs', "./res/test/expected/vote-API.js",
        { nickname: "vote", defaultContractName: "testcontract.testnet" }
    )
}
