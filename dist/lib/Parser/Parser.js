import { Lexer } from "../Lexer/Lexer.js";
import { ASTModule } from "./Grammar.js";
export class Parser {
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
        const ASTRoot = new ASTModule(this, lexer.filename);
        ASTRoot.parse();
        return ASTRoot;
    }
    parseFile(filename) {
        const lexer = new Lexer();
        lexer.openFile(filename);
        return this.parse(lexer);
    }
}
//# sourceMappingURL=Parser.js.map