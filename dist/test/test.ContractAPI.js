"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testContractAPIProducer = exports.testFor = void 0;
const path = require("path");
const mkPath = require("../lib/util/mkPath.js");
const logger = require("../lib/util/logger.js");
const color = require("../lib/util/color.js");
const fs_1 = require("fs");
const Parser_js_1 = require("../lib/Parser/Parser.js");
const ContractAPI_producer_1 = require("../main/ContractAPI-producer");
const child_process_1 = require("child_process");
const TESTNAME = "ContractAPI Producer";
function testFor(rustFile, expectedFile, data) {
    console.log("Testing " + TESTNAME);
    // parse
    let parsedModule;
    try {
        const parser = new Parser_js_1.Parser({ skipFunctionBody: true });
        // parse rust lib file
        parsedModule = parser.parseFile(rustFile);
    }
    catch (ex) {
        console.log(color.red + ex.message + color.normal);
        console.log(ex);
        console.log(process.cwd());
        console.log("Error parsing " + (parsedModule === null || parsedModule === void 0 ? void 0 : parsedModule.name));
        throw (ex);
    }
    console.log("parsed ok: " + (parsedModule === null || parsedModule === void 0 ? void 0 : parsedModule.name));
    const outPath = "out";
    mkPath.create(outPath);
    console.log("writing temp files in " + path.join(process.cwd(), outPath));
    const generatedFile = path.join(outPath, data.nickname + "-API.js");
    // produce
    try {
        ContractAPI_producer_1.ContractAPIProducer.produce(parsedModule, data, generatedFile);
    }
    catch (ex) {
        console.log(ex);
        console.log("Error producing " + (parsedModule === null || parsedModule === void 0 ? void 0 : parsedModule.name));
        throw (ex);
    }
    const generated = fs_1.readFileSync(generatedFile);
    const expected = fs_1.readFileSync(expectedFile);
    if (generated.toString() !== expected.toString()) {
        console.log(color.red + "FAILED " + color.normal);
        console.log("generated: " + generatedFile);
        console.log("expected: " + expectedFile);
        const compareCommand = "meld " + generatedFile + " " + expectedFile;
        console.log(" > " + compareCommand);
        child_process_1.spawn("meld", [generatedFile, expectedFile]);
    }
    else {
        console.log(TESTNAME + " Test " + color.green + "OK" + color.normal);
    }
}
exports.testFor = testFor;
function testContractAPIProducer() {
    logger.setDebugLevel(0);
    // logger.setDebugLevel(1,1)
    testFor('./res/test/rust/NEARSwap/src/lib.rs', "./res/test/expected/swap-API.js", { nickname: "swap", defaultContractName: "near-clp.betanet" });
    // logger.setDebugLevel(0)
    // logger.setDebugLevel(1,500)
    testFor('./res/test/rust/staking-pool/src/lib.rs', "./res/test/expected/staking-pool-API.js", { nickname: "tom", defaultContractName: "tomstaker.stakehouse.betanet" });
    // logger.setDebugLevel(0)
    // logger.setDebugLevel(1,150)
    testFor('./res/test/rust/lockup/src/lib.rs', "./res/test/expected/lockup-API.js", { nickname: "lockup", defaultContractName: "testcontract.testnet" });
    testFor('./res/test/rust/multisig/src/lib.rs', "./res/test/expected/multisig-API.js", { nickname: "multisig", defaultContractName: "testcontract.testnet" });
    testFor('./res/test/rust/staking-pool-factory/src/lib.rs', "./res/test/expected/factory-API.js", { nickname: "factory", defaultContractName: "testcontract.testnet" });
    testFor('./res/test/rust/voting/src/lib.rs', "./res/test/expected/vote-API.js", { nickname: "vote", defaultContractName: "testcontract.testnet" });
}
exports.testContractAPIProducer = testContractAPIProducer;
//# sourceMappingURL=test.ContractAPI.js.map