import * as path from "path"
import * as mkPath from "../lib/util/mkPath.js"
import { copyFileSync, readFileSync } from "fs"
import { logger } from "../lib/util/logger.js"
import { Parser } from "../lib/Parser/Parser.js"
import { ContractAPIProducer as Producer} from "../main/ContractAPI-producer"
import * as color from '../lib/util/color.js'

const TESTNAME = "ContractAPI Producer"

type dataInfo = {
    nickname: string;
    defaultContractName: string;
}

export function testFor(rustFile: string, expectedFile:string, data: dataInfo) {

    console.log("Testing "+TESTNAME)

    //parse
    let parsedModule 
    try {
        const parser = new Parser()
        //parse rust lib file
        parsedModule = parser.parseFile(rustFile)
    }
    catch (ex) {
        console.log(color.red+ex.message+color.normal)
        console.log(ex)
        console.log(process.cwd())
        console.log("Error parsing " + parsedModule?.name)
        throw(ex)
    }

    console.log("parsed ok: " + parsedModule?.name)

    const outPath = "out"
    mkPath.create(outPath)

    console.log("writing temp files in " +path.join(process.cwd(), outPath))

    const generatedFile= path.join(outPath, data.nickname+"-API.js")

    //produce
    try {
        Producer.produce(parsedModule, data, generatedFile)
    }
    catch (ex) {
        console.log(ex)
        console.log("Error producing " + parsedModule?.name)
        throw (ex)
    }

    const generated = readFileSync(generatedFile)

    const expected = readFileSync(expectedFile)

    if (generated.toString()!==expected.toString()){
        console.log(color.red+"FAILED "+color.normal)
        console.log("generated: "+generatedFile)
        console.log("expected: "+expectedFile)
        console.log(" > meld "+generatedFile+" "+expectedFile)
    }
    else {
        console.log(TESTNAME+" Test "+color.green+"OK"+color.normal)
       
    }
}

export function testContractAPIProducer() {

    logger.setDebugLevel(0)
    //logger.setDebugLevel(1,500)

    testFor('./res/test/rust/NEARSwap/src/lib.rs', "./res/test/expected/swap-API.js",
        {nickname: "swap", defaultContractName: "near-clp.betanet" }
    )

    logger.setDebugLevel(0)
    //logger.setDebugLevel(1,500)

    testFor('./res/test/rust/staking-pool/src/lib.rs', "./res/test/expected/staking-pool-API.js",
        {nickname: "tom", defaultContractName: "tomstaker.stakehouse.betanet" }
    )

    logger.setDebugLevel(0)
    //logger.setDebugLevel(1,500)

    testFor('./res/test/rust/lockup/src/lib.rs', "./res/test/expected/lockup-API.js",
        {nickname: "lockup", defaultContractName: "testcontract.testnet" }
    )

    testFor('./res/test/rust/multisig/src/lib.rs', "./res/test/expected/multisig-API.js",
        {nickname: "multisig", defaultContractName: "testcontract.testnet" }
    )

    testFor('./res/test/rust/staking-pool-factory/src/lib.rs', "./res/test/expected/factory-API.js",
        {nickname: "factory", defaultContractName: "testcontract.testnet" }
    )

    testFor('./res/test/rust/voting/src/lib.rs', "./res/test/expected/vote-API.js",
        {nickname: "vote", defaultContractName: "testcontract.testnet" }
    )

    testFor('./res/test/rust/whitelist/src/lib.rs', "./res/test/expected/whitelist-API.js",
        {nickname: "whitelist", defaultContractName: "testcontract.testnet" }
    )
}