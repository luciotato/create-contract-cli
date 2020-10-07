import { writeFileSync } from "fs"
import * as path from "path"
import { cliConfig } from "../CLIConfig"
import { red, green, normal } from "./color"

export function saveConfig(userAccount: string, contractAccount: string): void {
    // @ts-ignore -- import.meta.url
    let basedir = path.join(path.dirname(new URL(import.meta.url).pathname), "..")
    if (basedir.startsWith("\\")) basedir = basedir.slice(1) // windows compat remove extra "\"
    const cliConfigPath = path.join(basedir, "CLIConfig.js")
    process.stdout.write(`saving cli-config to ${cliConfigPath}...`)
    try {

        if (!userAccount) userAccount = cliConfig.userAccount;
        if (!contractAccount) contractAccount = cliConfig.contractAccount;

        const text = `
        export const cliConfig =
            {
                userAccount: "${userAccount}",
                contractAccount: "${contractAccount}"
            }
        `;

        writeFileSync(cliConfigPath, text)
        console.log(`${green}OK${normal}`)
    }
    catch (err) {
        console.log(`${red}ERR:${err.message}${normal}`)
        throw (err)
    }

}