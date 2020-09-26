//test/index.ts
import { logger } from "../util/logger"
import { Parser } from "../Parser/Parser"
//import { D3Visualization } from "./src/Producer/D3Visualization"
//import { AssemblyScriptProducer as Producer} from "../Producer/AssemblyScriptProducer"
import { ContractCliProducer as Producer } from "../Producer/create-contract-cli-producer"
import * as mkPath from "../util/mkPath"
import * as path from "path"
import { copyFileSync } from "fs"

function main() {

    logger.debugEnabled = false

    let parsedModule 

    const data = {
        nickName: "tom",
        defaultContractName: "tomstaker.stakehouse.betanet"
    }
    const projectName = `${data.nickName}-cli`

    const projectPath = path.join("out", projectName)
    mkPath.create(projectPath)

    console.log(path.join(process.cwd(), projectPath))

    //parse
    try {

        const parser = new Parser()
        parsedModule = parser.parseFile('./src/tests/staking-pool/src/lib.rs')

    }
    catch (ex) {
        console.log("Error parsing " + parsedModule.name)
        console.log(ex)
        throw(ex)
    }

    console.log("parsed ok: " + parsedModule.name)
    //D3Visualization.saveForTree(parsedModule, "./data.json")

    //produce
    try {
        Producer.produce(parsedModule, data, path.join(projectPath, "ContractAPI.js"))
    }
    catch (ex) {
        console.log("Error producing " + parsedModule.name)
        console.log(ex)
        throw (ex)
    }

    //add auxiliary files
    try {
        mkPath.create(path.join(projectPath, "util"))
        const modelPath = path.join("dist", "src", "tests", "model", "hand-coded-tom")
        copyFileSync(path.join(modelPath, "tom.js"), path.join(projectPath, data.nickName+".js"))
        for (const file of ["CommandLineArgs", "CommonCLIOptions", "ShowHelpPage", "SpawnNearCli"]) {
            copyFileSync(path.join(modelPath, "util", file + ".js"), path.join(projectPath, "util", file + ".js"))
        }
    }
    catch (ex) {
        console.log("copying files")
        console.log(ex)
        throw (ex)
    }

    console.log("END")
}

try {
    console.log('Starting')
    main()
}
catch (ex) {
    console.log(ex)
}


/*process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
*/
