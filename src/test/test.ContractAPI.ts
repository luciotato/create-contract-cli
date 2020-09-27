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

    const generatedFile= path.join(outPath, data.nickname+"-contract-API.js")

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
        console.log("expected: "+expectedFile)
        console.log("generated: "+generatedFile)
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

}