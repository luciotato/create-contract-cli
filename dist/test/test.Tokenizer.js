"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testTokenizer = void 0;
const Lexer_js_1 = require("../lib/Lexer/Lexer.js");
const expect_js_1 = require("./expect.js");
function testThis(rustCode, expected) {
    process.stdout.write("Testing tokenizer ");
    const lexer = new Lexer_js_1.Lexer();
    lexer.startFromString(rustCode);
    const tokens = [];
    while (true) {
        const t = lexer.token;
        if (!t.isSpace())
            tokens.push(`(${Lexer_js_1.TokenCode[t.tokenCode]} ${t.value})`);
        if (t.tokenCode == Lexer_js_1.TokenCode.EOF)
            break;
        lexer.advance();
    }
    expect_js_1.default("tokenizer", tokens).toBe(expected);
}
function testTokenizer() {
    let rustCode = "\n\
    /// The amount of gas given to complete `vote` call.\n\
    const VOTE_GAS: u64 = 100_000_000_000_000;\n\
    \n\
    /// The amount of gas given to complete internal `on_stake_action` call.\n\
    const ON_STAKE_ACTION_GAS: u64 = 20_000_000_000_000;\n\
    ";
    testThis(rustCode, ["(COMMENT /// The amount of gas given to complete `vote` call.)",
        "(WORD const)", "(WORD VOTE_GAS)", "(PUNCTUATION :)", "(WORD u64)", "(OPERATOR =)", "(NUMBER 100_000_000_000_000)", "(PUNCTUATION ;)",
        "(COMMENT /// The amount of gas given to complete internal `on_stake_action` call.)",
        "(WORD const)", "(WORD ON_STAKE_ACTION_GAS)", "(PUNCTUATION :)", "(WORD u64)", "(OPERATOR =)", "(NUMBER 20_000_000_000_000)", "(PUNCTUATION ;)",
        "(EOF )"]);
    // ---------------------
    rustCode = `
        impl fmt::Display for PoolInfo {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                return write!(
                    f,
                    "({}, {}, {})",
                    self.ynear, self.reserve, self.total_shares
                );
            }
        }`;
    testThis(rustCode, ['(WORD impl)', '(WORD fmt)', '(PUNCTUATION ::)', '(WORD Display)', '(WORD for)', '(WORD PoolInfo)', '(PUNCTUATION {)',
        '(WORD fn)', '(WORD fmt)', '(PUNCTUATION ()', '(OPERATOR &)', '(WORD self)', '(PUNCTUATION ,)', '(WORD f)',
        '(PUNCTUATION :)', '(OPERATOR &)', '(WORD mut)', '(WORD fmt)', '(PUNCTUATION ::)',
        '(WORD Formatter)', "(PUNCTUATION <')", '(WORD _)', '(OPERATOR >)', '(PUNCTUATION ))',
        '(OPERATOR ->)', '(WORD fmt)', '(PUNCTUATION ::)', '(WORD Result)', '(PUNCTUATION {)',
        '(WORD return)', '(WORD write)', '(OPERATOR !)', '(PUNCTUATION ()',
        '(WORD f)', '(PUNCTUATION ,)',
        '(LITERAL_STRING "({}, {}, {})")',
        '(PUNCTUATION ,)',
        '(WORD self)', '(PUNCTUATION .)', '(WORD ynear)', '(PUNCTUATION ,)', '(WORD self)', '(PUNCTUATION .)', '(WORD reserve)',
        '(PUNCTUATION ,)', '(WORD self)', '(PUNCTUATION .)', '(WORD total_shares)', '(PUNCTUATION ))', '(PUNCTUATION ;)',
        '(PUNCTUATION })',
        '(PUNCTUATION })',
        '(EOF )']);
}
exports.testTokenizer = testTokenizer;
//# sourceMappingURL=test.Tokenizer.js.map