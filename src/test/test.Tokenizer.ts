import { TokenCode, Lexer, Token } from "../lib/Lexer/Lexer.js"
import expect from "./expect.js"

export function testTokenizer() {

    process.stdout.write("Testing tokenizer ")

    let lexer = new Lexer()

    let rustCode = "\n\
    /// The amount of gas given to complete `vote` call.\n\
    const VOTE_GAS: u64 = 100_000_000_000_000;\n\
    \n\
    /// The amount of gas given to complete internal `on_stake_action` call.\n\
    const ON_STAKE_ACTION_GAS: u64 = 20_000_000_000_000;\n\
    "

    lexer.startFromString(rustCode)

    let tokens: string[] = []
    while (true) {
        let t: Token = lexer.token
        if (!t.isSpace()) tokens.push(`(${TokenCode[t.tokenCode]} ${t.value})`)
        if (t.tokenCode == TokenCode.EOF) break
        lexer.advance()
    }

    expect(tokens).toBe(
        ["(COMMENT /// The amount of gas given to complete `vote` call.)",
            "(WORD const)", "(WORD VOTE_GAS)", "(PUNCTUATION :)", "(WORD u64)", "(ASSIGNMENT =)", "(NUMBER 100_000_000_000_000)", "(PUNCTUATION ;)",
            "(COMMENT /// The amount of gas given to complete internal `on_stake_action` call.)",
            "(WORD const)", "(WORD ON_STAKE_ACTION_GAS)", "(PUNCTUATION :)", "(WORD u64)", "(ASSIGNMENT =)", "(NUMBER 20_000_000_000_000)", "(PUNCTUATION ;)",
            "(EOF )"])

}
