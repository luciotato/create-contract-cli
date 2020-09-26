import { Lexer } from "../Lexer/Lexer"
import { ASTModule, StructDeclaration } from "./Grammar"
import { CodeWriter } from "./CodeWriter";

export class Parser {
    lexer: Lexer
    hardError: Error;
    codeWriter: CodeWriter

    //declaredStructs = new Map<string, StructDeclaration>()
    declaredStructs: { [index: string]: StructDeclaration } = { };

    /**
     * creates the AST 
     * returns Root Node: type Module
     * */
    parse(lexer: Lexer): ASTModule {
        this.lexer = lexer
        const ASTRoot = new ASTModule(this, lexer.filename)
        ASTRoot.parse()
        return ASTRoot
    }

    parseFile(filename:string): ASTModule {
        const lexer = new Lexer()
        lexer.openFile(filename)
        return this.parse(lexer)
    }
}