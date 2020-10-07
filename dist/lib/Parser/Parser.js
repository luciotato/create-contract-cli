"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const Lexer_1 = require("../Lexer/Lexer");
const Grammar_1 = require("./Grammar");
class Parser {
    constructor(options) {
        // declaredStructs = new Map<string, StructDeclaration>()
        this.declaredStructs = {};
        this.options = options;
    }
    /**
     * creates the AST
     * returns Root Node: type Module
     * */
    parse(lexer) {
        this.lexer = lexer;
        const ASTRoot = new Grammar_1.ASTModule(this, lexer.filename);
        ASTRoot.parse();
        return ASTRoot;
    }
    parseFile(filename) {
        const lexer = new Lexer_1.Lexer();
        lexer.openFile(filename);
        return this.parse(lexer);
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map