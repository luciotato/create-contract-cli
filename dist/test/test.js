"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_Tokenizer_js_1 = require("./test.Tokenizer.js");
const test_ContractAPI_js_1 = require("./test.ContractAPI.js");
const CommandLineArgs_1 = require("../model/hand-coded-tom/util/CommandLineArgs");
const CLIOptions_js_1 = require("../model/hand-coded-tom/CLIOptions.js");
const expect_js_1 = require("./expect.js");
function testCLIparser() {
    const cmdline = `node nearswap add_liquidity { token: "gold.nearswap.testnet", max_tokens: 10, min_shares: 5 } --amount 10`;
    process.argv = cmdline.split(' ');
    const a = new CommandLineArgs_1.CommandLineArgs(CLIOptions_js_1.options);
    expect_js_1.default("command", a.consumeString("cmd")).toBe("add_liquidity");
    expect_js_1.default("JSON", a.consumeJSON("json args")).toBe({ token: '"gold.nearswap.testnet"', max_tokens: "10" + "".padEnd(24, "0"), min_shares: "5" + "".padEnd(24, "0") });
    expect_js_1.default("options.amount", CLIOptions_js_1.options.amount.value).toBe(10);
}
console.log("---------- START PARSE TESTS ---------");
testCLIparser();
test_Tokenizer_js_1.testTokenizer();
test_ContractAPI_js_1.testContractAPIProducer();
console.log("---------- END PARSE TESTS ---------");
console.log("---------- START TESTNET DEPLOY TESTS ---------");
console.log("---------- END TESTNET DEPLOY TESTS ---------");
//# sourceMappingURL=test.js.map