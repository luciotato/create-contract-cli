"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveConfig = void 0;
const fs_1 = require("fs");
const path = require("path");
const CLIConfig_1 = require("../CLIConfig");
const color_1 = require("./color");
function saveConfig(userAccount, contractAccount) {
    // @ts-ignore -- import.meta.url
    let basedir = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
    if (basedir.startsWith("\\"))
        basedir = basedir.slice(1); // windows compat remove extra "\"
    const cliConfigPath = path.join(basedir, "CLIConfig.js");
    process.stdout.write(`saving cli-config to ${cliConfigPath}...`);
    try {
        if (!userAccount)
            userAccount = CLIConfig_1.cliConfig.userAccount;
        if (!contractAccount)
            contractAccount = CLIConfig_1.cliConfig.contractAccount;
        const text = `
        export const cliConfig =
            {
                userAccount: "${userAccount}",
                contractAccount: "${contractAccount}"
            }
        `;
        fs_1.writeFileSync(cliConfigPath, text);
        console.log(`${color_1.green}OK${color_1.normal}`);
    }
    catch (err) {
        console.log(`${color_1.red}ERR:${err.message}${color_1.normal}`);
        throw (err);
    }
}
exports.saveConfig = saveConfig;
//# sourceMappingURL=saveConfig.js.map