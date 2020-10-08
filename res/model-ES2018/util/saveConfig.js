const fs=require("fs")
const path=require("path")
const cliConfig = require("../CLIConfig.js")
const color=require("./color.js")

//saveConfig
module.exports=function(userAccount, contractAccount) {
    // @ts-ignore -- import.meta.url
    let basedir = path.join(__dirname, "..")
    if (basedir.startsWith("\\")) basedir = basedir.slice(1) // windows compat remove extra "\"
    let cliConfigPath = path.join(basedir, "CLIConfig.js")
    cliConfigPath = path.relative(process.cwd(),cliConfigPath)
    process.stdout.write(`saving cli-config to ${cliConfigPath}...`)
    try {

        if (!userAccount) userAccount = cliConfig.userAccount;
        if (!contractAccount) contractAccount = cliConfig.contractAccount;

        const text = `
        module.exports = {
            nickname: "${cliConfig.nickname}",
            userAccount: "${userAccount}",
            contractAccount: "${contractAccount}"
        }`

        fs.writeFileSync(cliConfigPath, text)
        console.log(`${color.green}OK${color.normal}`)
    }
    catch (err) {
        console.log(`${color.red}ERR:${err.message}${color.normal}`)
        throw (err)
    }

}