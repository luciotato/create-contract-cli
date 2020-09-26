import * as path from "path"
import * as mkPath from "../lib/util/mkPath.js"
import { copyFileSync, readFileSync } from "fs"
import { logger } from "../lib/util/logger.js"
import { Parser } from "../lib/Parser/Parser.js"
import { ContractAPIProducer as Producer} from "../ContractAPI-producer"
import { color } from "../lib/util/color.js"

const TESTNAME = "ContractAPI Producer"

export function testContractAPIProducer() {

    console.log("Testing "+TESTNAME)

    logger.debugEnabled = false

    //parse
    let parsedModule 
    try {
        const parser = new Parser()
        //parse rust lib file
        parsedModule = parser.parseFile('./res/test/staking-pool/src/lib.rs')
    }
    catch (ex) {
        console.log(ex)
        console.log(process.cwd())
        console.log("Error parsing " + parsedModule?.name)
        throw(ex)
    }

    console.log("parsed ok: " + parsedModule?.name)

    const outPath = "out"
    mkPath.create(outPath)

    console.log("writing temp files in " +path.join(process.cwd(), outPath))

    const data = {
        nickName: "tom",
        defaultContractName: "tomstaker.stakehouse.betanet"
    }

    const generatedFile= path.join(outPath, data.nickName+"-contract-API.js")

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

    const expectedFile = "./res/test/expected/staking-pool-API.js"
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

