import { testTokenizer } from "./test.Tokenizer.js"
import { testContractAPIProducer } from "./test.ContractAPI.js"
import { CommandLineArgs } from "../model/hand-coded-tom/util/CommandLineArgs"
import { options } from "../model/hand-coded-tom/CLIOptions.js"
import expect from "./expect.js"

function testCLIparser() {
    const cmdline = `node nearswap add_liquidity { token: "gold.nearswap.testnet", max_tokens: 10, min_shares: 5 } --amount 10`

    process.argv = cmdline.split(' ')

    const a = new CommandLineArgs(options)

    expect("command", a.consumeString("cmd")).toBe("add_liquidity")

    expect("JSON", a.consumeJSON("json args")).toBe({ token: '"gold.nearswap.testnet"', max_tokens: "10" + "".padEnd(24, "0"), min_shares: "5" + "".padEnd(24, "0") })

    expect("options.amount", options.amount.value).toBe(10)
}

console.log("---------- START TESTS ---------")

testCLIparser()

testTokenizer()

testContractAPIProducer()

console.log("---------- END TESTS ---------")
