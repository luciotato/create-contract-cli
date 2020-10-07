import * as path from "path"
import * as fs from "fs"
import * as mkPath from "../lib/util/mkPath"
import * as color from '../lib/util/color.js'
import * as child_process from "child_process"
import * as logger from "../lib/util/logger"
import { Parser } from "../lib/Parser/Parser"
import { ContractAPIProducer as Producer } from "./ContractAPI-producer"
import { ASTModule } from "../lib/Parser/Grammar"
import { CommandLineArgs, ShowHelpOptions } from "../lib/util/CommandLineArgs"
import { options } from "./CLIOptions"
import { URL } from "url"

type dataInfo = {
    nickname: string;
}

// produce ContractAPI by parsing cotract/src/lib.rs
export function parseAndProduceAPIfor(rustFile: string, data: dataInfo, outFile: string): void {
    logger.setDebugLevel(0)

    // parse
    color.action(`Parsing ${rustFile}`)
    let parsedModule: ASTModule
    try {
        const parser = new Parser({ skipFunctionBody: true })
        // parse rust lib file
        parsedModule = parser.parseFile(rustFile)
    } catch (ex) {
        console.log(color.red + "ERR")
        console.log(ex.message + color.normal)
        color.logErr("parsing " + rustFile)
        console.log(color.green + "Workarounds:" + color.normal)
        console.log("* Simplify yout lib.rs (move to util.rs or internal.rs) [fast]")
        console.log("* You can report an issue on github.com/luciotato/create-contract-cli/issues [slow]" + color.normal)
        if (logger.debugLevel) {
            console.log(ex)
            throw (ex)
        }
        process.exit(1)
    }
    color.greenOK()

    // make output path
    try {
        mkPath.create(path.dirname(outFile))
    } catch (ex) {
        color.logErr("creating dir " + path.dirname(outFile))
        throw (ex)
    }

    // produce
    color.action(`Producing ${outFile}`)
    try {
        Producer.produce(parsedModule, data, outFile)
    } catch (ex) {
        console.log(color.red + "ERR")
        console.log(ex.message + color.normal)
        color.logErr("producing for " + parsedModule?.name)
        // console.log(color.green + "Workarounds:" + color.normal)
        // console.log("* Simplify yout lib.rs (move to util.rs or internal.rs) [fast]")
        // console.log("* You can report an issue on github.com/luciotato/create-contract-cli/issues [slow]" + color.normal)
        if (logger.debugLevel) {
            console.log(ex)
            throw (ex)
        }
        process.exit(2)
    }
    color.greenOK()
}

// ---------------------------
// ------ MAIN ---------------
// ---------------------------
function main() {
    const args = new CommandLineArgs(options)

    // Show help
    if (options.help.value) {
        console.log("create-command-cli")
        console.log("Parses your rust NEAR contract code interface from src/lib.rs and generates a cli-tool tailored to that contract")
        console.log()
        console.log("usage:")
        console.log(" > create-contact-cli [nickname] path/to/rust-project -c contract_account_id --accountId user_account_id ")
        console.log("where [nickname] is the name of your new cli-tool")
        console.log()
        console.log("Example:")
        console.log(" > create-contact-cli staky core-contracts/staker-pool -c mystaker.stakehouse.betanet --accountId lucio.testnet")
        console.log("This wil create a new cli tool named 'staky', to control the contract at mystaker.stakehouse.betanet")
        console.log("Type 'staky --help' after creation")
        ShowHelpOptions(options)
        process.exit(0)
    }

    const nickname = args.consumeString("nickname")

    const pathToRustProject = args.consumeString("path/to/rust-project")

    // check if we can find the rust source
    const rustSourceFile = path.join(pathToRustProject, "src", "lib.rs")
    try {
        fs.statSync(rustSourceFile)
    } catch (ex) {
        color.logErr("can't find " + rustSourceFile)
        color.logErr(ex.message)
        process.exit(1)
    }

    // both -c -acc are required
    args.requireOptionString(options.contractName)
    args.requireOptionString(options.accountId)

    // create project dir
    let projectDir = `${nickname}-cli`
    if (options.output.value) projectDir = path.join(options.output.value, projectDir)
    color.action(`Creating dir ${projectDir}`)
    try {
        mkPath.create(projectDir)
    } catch (ex) {
        color.logErr("can't mkdir " + projectDir)
        throw (ex)
    }
    color.greenOK()

    // create ContractAPI
    const generatedContractAPI = path.join(projectDir, "ContractAPI.js")
    // by parsing cotract/src/lib.rs
    const data = {
        nickname: nickname,
        defaultContractName: options.contractName.value,
        defaultUserAccountId: options.accountId.value
    }
    parseAndProduceAPIfor(rustSourceFile, data, generatedContractAPI)

    // add auxiliary files
    // console.log("Current dir: " +process.cwd())
    // console.log("this script: " +process.argv[1]) // \usr\local\bin\npm\node_modules\create-contract-cli\bin\cli
    // @ts-ignore -- import.meta.url
    let basedir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..")
    if (basedir.startsWith("\\")) basedir = basedir.slice(1) // windows compat remove extra "\"
    basedir=path.relative(process.cwd(),basedir)
    
    color.action(`Completing from ${basedir}/model`)
    try {
        mkPath.create(path.join(projectDir, "util"))

        //create package.json
        let pkg = fs.readFileSync(path.join(basedir, "res", "package.json")).toString()
        pkg = pkg.replace(/nickname/g, nickname)
        pkg = pkg.replace("${contract}", pathToRustProject.replace(/\\/g, "/")) // windows compat: c.\./
        pkg = pkg.replace("${contractAddress}", options.contractName.value)
        fs.writeFileSync(path.join(projectDir, "package.json"), pkg)

        //create cli.js
        let cli = fs.readFileSync(path.join(basedir, "res", "cli.js")).toString()
        cli = cli.replace(/nickname/g, nickname)
        fs.writeFileSync(path.join(projectDir, "cli.js"), cli)

        //create ${nickname}.js
        const modelPath = path.join(basedir, "dist", "model", "hand-coded-tom")
        fs.copyFileSync(path.join(modelPath, "tom.js"), path.join(projectDir, nickname + ".js"))

        //create CLIConfig.js
        const cliConfigPath = path.join(projectDir, "CLIConfig.js")
        const text = `
        export const cliConfig =
            {
                userAccount: "${options.accountId.value}",
                contractAccount: "${options.contractName.value}"
            }
        `;
        fs.writeFileSync(cliConfigPath, text)

        //copy common files - main dir
        for (const file of ["CLIOptions", "ExtensionAPI"]) {
            fs.copyFileSync(path.join(modelPath, file + ".js"), path.join(projectDir, file + ".js"))
        }
        //copy common files - util dir
        for (const file of ["SpawnNearCli", "CommandLineArgs", "saveConfig", "color"]) {
            fs.copyFileSync(path.join(modelPath, "util", file + ".js"), path.join(projectDir, "util", file + ".js"))
        }

    } catch (ex) {
        color.logErr("copying auxiliary files")
        throw (ex)
    }
    color.greenOK()

    if (options.nolink) {
        color.action(`${path.join(projectDir,nickname)} created`)
        color.greenOK()
    }
    else {
        console.log(`cd ${projectDir}`)
        console.log(`Executing npm link`)
        const spawnOptions: child_process.CommonSpawnOptions = {
            shell: true, // shell:true => to be able to invoke on windows
            cwd: projectDir,
            stdio: "inherit"
        }
        const execResult = child_process.spawnSync("npm", ["link"], spawnOptions)
        if (execResult.error) {
            color.logErr(execResult.error.message)
            process.exit(5)
        }

        console.log()
        console.log(color.yellow + "WARN: nmp link may report ERR:code EEXISTS. You can ignore that." + color.normal)
        console.log()
        console.log("now type:")
        console.log(` > ${nickname} --help`)
    }

}

main()
