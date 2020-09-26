import { ASTBase } from "../Parser/ASTBase";
import * as Grammar from "../Parser/Grammar";
import { Parser } from "../Parser/Parser";
import { CodeWriter } from "../Parser/CodeWriter";

import * as Path from 'path'

let globalTestFlag = false; //if the rust fn is decorated with "#[test]
let debugProduceLineNumbers = false

class ASCodeWriter extends CodeWriter {
    importDone: boolean
}

/**
 * extended here to insert "return" before the last expression (rust returns the last expression implicitly)
 * output all node children as the body of a function
 * indented, one on each line
 * */
class RustFnBodyWriter extends ASTBase {

    produceBody(indent: number = 4, insertReturn: boolean = true): void {

        const o = this.owner.codeWriter
        o.newLine()
        o.indent += indent
        let inx = 0
        for (const child of this.children) {

            globalTestFlag = child.writeComments("#[test]")

            if (debugProduceLineNumbers) {
                o.write(`${child.sourceLineNum}: `)
                if (child.sourceLineNum == 544) {
                    o.write("*") //debug breakpoint here
                }
            }

            child.produce()

            if (insertReturn && inx == this.children.length - 1) { //ultimo statement
                if (child instanceof Grammar.VarRef
                    || child instanceof Grammar.ObjectLiteral
                    || child instanceof Grammar.MatchExpression
                    || child instanceof Grammar.Expression
                    || child instanceof Grammar.ParenExpression) {
                    o.currLine.splice(0, 0, "return ")
                }
            }

            inx++
            o.newLine()
        }

        o.indent -= indent
    }
}

class ASTModuleWriter extends Grammar.ASTModule {
    produce() {
        this.owner.codeWriter.writeLine("// ----------------------------------------------")
        this.owner.codeWriter.writeLine("// Transpiled by rs2as - source: " + this.owner.lexer.filename)
        this.owner.codeWriter.writeLine("// ---------------------------------------------")
        this.produceBody(0)
    }
}
Grammar.ASTModule.prototype.produce = ASTModuleWriter.prototype.produce

Grammar.UseDeclaration.prototype.produce = function () {
    if (!this.owner.codeWriter.importDone) {
        this.owner.codeWriter.importDone = true
        this.owner.codeWriter.writeLine('import { Context, logging, storage } from "near-sdk-as".js')
    }
}

Grammar.StaticDeclaration.prototype.produce = function () {
    if (this.name != "ALLOC") {
        this.owner.codeWriter.writeLine('// static ' + this.name)
    }
}

Grammar.StructDeclaration.prototype.produce = function () {
    //if (this.children.count == 1) {
    this.owner.codeWriter.writeLine('// declare struct ' + this.name)
    //}
}

class ImplDeclarationWriter extends Grammar.ImplDeclaration {
    produceTS() {
        const o = this.owner.codeWriter
        o.write('// ' + this.keyword + ' ' + this.name)
        this.produceBody(0)
    }
}
Grammar.ImplDeclaration.prototype.produce = ImplDeclarationWriter.prototype.produceTS
Grammar.ModDeclaration.prototype.produce = ImplDeclarationWriter.prototype.produceTS


class FunctionDeclarationWriter extends Grammar.FunctionDeclaration {
    produceTS() {
        const o = this.owner.codeWriter
        if (this.isPublic) o.write("export ")
        o.write("function ")
        o.write(this.name)

        //param decl
        o.write("(")
        let inx = 0
        for (const paramDecl of this.paramsDeclarations.children) {
            if (paramDecl.name != 'self') { //rust 'self' is implicit 'this' in ts
                if (inx > 0) o.write(", ")
                paramDecl.produce()
                inx++
            }
        }
        o.write(")")
        //end param decl

        //Type Annotation
        this.typeAnnotation?.produce()
        const hasReturnValue = (this.typeAnnotation!=undefined)

        //Body
        if (this.children.length) {
            o.write(' {')
            RustFnBodyWriter.prototype.produceBody.call(this, 4, hasReturnValue)
            o.writeLine('}')
        }
    }
}
Grammar.FunctionDeclaration.prototype.produce = FunctionDeclarationWriter.prototype.produceTS

export class TypeAnnotationWriter extends Grammar.TypeAnnotation {
    produceTS() {
        const o = this.owner.codeWriter
        o.write(": ")
        //this.optAddrOf()
        //this.optMut()
        let replaced = this.name.replace("::", ".")
        switch (replaced) {
            case 'str': replaced = "string"; break
            default:
        }
        o.write(replaced)
        //if (this.opt('<')) {
        //    this.children = this.reqSeparatedList(Identifier, ',', '>')
        //}
    }
}
Grammar.TypeAnnotation.prototype.produce = TypeAnnotationWriter.prototype.produceTS

export class VarDeclWriter extends Grammar.VariableDecl {
    produceTS() {
        const o = this.owner.codeWriter
        o.write(this.name)
        this.typeAnnotation?.produce()

        if (this.assignedExpression) {

            o.write(" = ")

            if (this.assignedExpression.name == 'env') { //rust 'env' => AS 'Context'

                o.write('Context.')

                switch (this.assignedExpression.root.name) {
                    case 'env::signer_account_id':
                        o.write('sender')
                        break;

                    default:
                        this.assignedExpression.root.produce()
                }
            }

            else {
                this.assignedExpression.produce()
            }
        }
    }
}
Grammar.VariableDecl.prototype.produce = VarDeclWriter.prototype.produceTS

export class ExpressionWriter extends Grammar.Expression {
    produceTS() {
        //const o = this.owner.codeWriter
        this.root?.produce()
    }
}
Grammar.Expression.prototype.produce = ExpressionWriter.prototype.produceTS

export class ParenExpressionWriter extends Grammar.ParenExpression {
    produceTS() {
        const o = this.owner.codeWriter
        o.write("(")
        this.produceChildren()
        o.write(")")
    }
}
Grammar.ParenExpression.prototype.produce = ParenExpressionWriter.prototype.produceTS

export class LetStatementWriter extends Grammar.LetStatement {
    produceTS() {
        const o = this.owner.codeWriter
        o.write("let ")
        this.produceChildren(", ")
    }
}
Grammar.LetStatement.prototype.produce = LetStatementWriter.prototype.produceTS

export class ConstDeclarationWriter extends Grammar.ConstDeclaration {
    produceTS() {
        const o = this.owner.codeWriter
        o.write("const ")
        o.write(this.name)
        this.children[0].produce() //type annotation
        o.write("  = ")
        this.children[1].produce() //assigned expression
    }
}
Grammar.ConstDeclaration.prototype.produce = ConstDeclarationWriter.prototype.produceTS

export class TypeDeclarationWriter extends Grammar.TypeDeclaration {
    produceTS() {
        const o = this.owner.codeWriter
        o.write("type ")
        o.write(this.name)
        o.write("  = ")
        this.produceChildren()
    }
}
Grammar.TypeDeclaration.prototype.produce = TypeDeclarationWriter.prototype.produceTS

export class VarRefWriter extends Grammar.VarRef {
    produceTS() {
        const o = this.owner.codeWriter
        if (this.name == 'self') { 
            o.write('this')
        }
        else if (this.name == 'env::log') { //rust 'env::log' => AS logging.log
            o.write('logging.log')
        }
        else {
            o.write(this.name.replace("::","."))
        }
        //accessors 
        this.produceChildren()
    }
}
Grammar.VarRef.prototype.produce = VarRefWriter.prototype.produceTS

const superObjectLiteralProduce : Function = Grammar.ObjectLiteral.prototype.produce
export class ObjectLiteralWriter extends Grammar.ObjectLiteral {
    produceTS() {
        const o = this.owner.codeWriter
        o.indent+=4
        superObjectLiteralProduce.call(this)
        if (this.name) { //"struct-instantiation") {
            o.write(` as ${this.name}`)
        }
        o.indent -= 4
    }
}
Grammar.ObjectLiteral.prototype.produce = ObjectLiteralWriter.prototype.produceTS


export class FunctionArgumentWriter extends Grammar.FunctionArgument {
    produceTS() {
        const o = this.owner.codeWriter
        if (this.expression) {
            this.expression.produce()
        }
        else {
            o.write("undefined") // rust _ wildcard argument
        }
    }
}
Grammar.FunctionArgument.prototype.produce = FunctionArgumentWriter.prototype.produceTS

// ---------------------------
//function outNativeRustConversionMapCollect(item: ASTBase) {
//    //veo si al final de la expresion hay uno o mas .into() o .as_u128() .to_vec() .map() . collect() etc, 
//    // que son sufijos de conversiones de rust y de map()
//    const o = item.owner.codeWriter
//    if (item.nativeSuffixes) {
//        for (const suffixIdent of item.nativeSuffixes.children) {
//            o.write(".")
//            suffixIdent.produce()
//            o.write("(")
//            suffixIdent.produceChildren()
//            o.write(")")
//        }
//    }
//}

export class RustClosureWriter extends Grammar.RustClosure {
    produceTS() {
        const o = this.owner.codeWriter
        o.write("function(")
        for (const param of this.params) {
            param.produce()
        }
        o.writeLine(") {")
        if (this.children.length == 1 && this.children[0] instanceof Grammar.Expression) {
            o.write("return ")
        }
        this.produceChildren()
        o.writeLine("}")
    }
}
Grammar.RustClosure.prototype.produce = RustClosureWriter.prototype.produceTS


export class MacroInvocationWriter extends Grammar.MacroInvocation {

    produceStringInterpolation(o: CodeWriter) {
        const template = this.macroWords[1].slice(1, -1) //Remove quotes
        const allParams: string = this.macroWords.slice(3,-1).join("") //remove macro!("template", and closing parenthesis
        const paramUnits = allParams.split(",")
        //const templateParams = this.macroWords.filter(word => word != ',' && word != ')') //exclude commas and the closing ")"
        let inx = 0
        const parts = template.split("{}")
        for (const part of parts) {
            if (part == "") continue
            if (inx > 0) o.write(" + ")
            o.write('"' + part + '"')
            if (inx < paramUnits.length) {
                o.write(" + ")
                o.write(paramUnits[inx])
                o.write(".toString()")
                inx++
            }
        }
    }

    produceMacroWords(name: string, o: CodeWriter) {
        o.write(name)
        for (const word of this.macroWords) {
            let out = word;
            if (word == "self") out = "this";
            o.write(out)
        }
    }

    produceTS() {
        const o = this.owner.codeWriter
        let name = this.name
        switch (name) {
            case "format!": {
                this.produceStringInterpolation(o)
                break
            }
            case "println!": {
                o.write("console.log(")
                this.produceStringInterpolation(o)
                o.write(")")
                break
            }
            case "assert!": {
                this.produceMacroWords("assert", o)
                break;
            }
            case "assert_eq!": {
                if (globalTestFlag) {
                    o.write("expect(")
                    this.children[0].produce()
                    o.write(").toBe(")
                    this.children[1].produce()
                    o.write(")")
                }
                else {
                    o.write("assert(")
                    this.children[0].produce()
                    o.write(" == ")
                    this.children[1].produce()
                    o.write(")")
                    if (this.children.length > 2) { //assert failed message
                        o.write(" //") 
                        this.children[2].produce()
                    }
                }
                break
            }
            default:
                this.produceMacroWords(this.name,o)
        }
    }
}
Grammar.MacroInvocation.prototype.produce = MacroInvocationWriter.prototype.produceTS
//@ts-ignore
Grammar.MacroInvocation.prototype.produceStringInterpolation = MacroInvocationWriter.prototype.produceStringInterpolation
//@ts-ignore
Grammar.MacroInvocation.prototype.produceMacroWords = MacroInvocationWriter.prototype.produceMacroWords


export class MatchExpressionWriter extends Grammar.MatchExpression {
    produceTS() {
        const o = this.owner.codeWriter
        o.write("const value=")
        this.exprToMatch.produce()
        o.newLine()
        let inx = 0;
        for (const mp of this.children as Grammar.MatchPair[]) {
            if (inx >= 1) o.write(" : ")
            o.write("value==")
            if (mp.left) {
                if (mp.left.name == "None") {
                    o.write("undefined")
                }
                else {
                    mp.left.produce()
                }
                o.write("? ")
                mp.right.produce()
            }
            else {
                mp.right.produce()
            }
            inx++
        }
    }
}
Grammar.MatchExpression.prototype.produce = MatchExpressionWriter.prototype.produceTS

// ---------------------------
export class IfStatementWriter extends Grammar.IfStatement {
    //conditional: Expression
    // ---------------------------
    produceTS() {
        const o = this.owner.codeWriter
        o.write("if (")
        this.conditional.produce()
        o.write("){")
        this.children[0].produce()
        o.write("}")
        if (this.children.length > 1) {
            o.write("else {")
            this.children[0].produce()
            o.write("}")
        }
    }
}
Grammar.IfStatement.prototype.produce = IfStatementWriter.prototype.produceTS
// end class IfStatement

export class AssemblyScriptProducer {

    static produce(root: ASTBase, outFilename: string) {

        const parser: Parser = root.owner
        parser.codeWriter = new ASCodeWriter(outFilename, {})

        console.log(Path.join(process.cwd(), outFilename))

        root.produce()

        parser.codeWriter.close()

    }
}
