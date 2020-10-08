import { ASTBase } from "../lib/Parser/ASTBase"
import * as Grammar from "../lib/Parser/Grammar"
import { Parser } from "../lib/Parser/Parser"
import { CodeWriter, CodeWriterData } from "../lib/Parser/CodeWriter"
import * as logger from "../lib/util/logger"

// let globalTestFlag = false; //if the rust fn is decorated with "#[test]
// let debugProduceLineNumbers = false

class ASTModuleWriter extends Grammar.ASTModule {
    produce() {
        const o = this.owner.codeWriter
        o.writeLine(`
    // ----------------------------------------------
    // generated by create-contract-cli from ${this.owner.lexer.filename}
    // ---------------------------------------------

    const color = require("./util/color.js");
    const nearCli = require("./util/SpawnNearCli.js");
    const options = require("./CLIOptions.js");
    const cliConfig = require("./CLIConfig.js");

    // name of this script
    const nickname = cliConfig.nickname;

    // one function for each pub fn in the contract
    // get parameters by consuming from CommandLineParser
    class ContractAPI {

        // this.view helper function
        view(command/*:string*/, fnJSONParams/*?:any*/) /*:string*/ {
            return nearCli.view(cliConfig.contractAccount, command, fnJSONParams, options)
        }
        // this.call helper function
        call(command/*:string*/, fnJSONParams/*?:any*/) /*:string*/ {
            return nearCli.call(cliConfig.contractAccount, command, fnJSONParams, options)
        }
    
    `)
        o.indent += 2
        o.newLine()

        let mainImpl

        // look for main Impl (the one with #[init])
        for (const implDecl of this.children) {
            if (implDecl instanceof Grammar.ImplDeclaration) {
                for (const fns of implDecl.children) {
                    if (fns.commentsAndAttr.includes("#[init]")) {
                        mainImpl = implDecl
                    }
                }
            }
        }

        for (const implDecl of this.children) {
            if (implDecl instanceof Grammar.ImplDeclaration) {
                if (mainImpl !== undefined && implDecl !== mainImpl) {
                    continue
                } else {
                    // produce children of main impl
                    for (const child of implDecl.children) {
                        child.produce()
                        o.newLine()
                    }
                }
            }
        }
        o.indent -= 2
        o.newLine()
        o.writeLine(`}`)
        o.writeLine(`module.exports = ContractAPI;`)
    }
}
Grammar.ASTModule.prototype.produce = ASTModuleWriter.prototype.produce

class EmptyProducer extends Grammar.Statement {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    produce() {
    }
}
Grammar.ImplDeclaration.prototype.produce = EmptyProducer.prototype.produce
Grammar.StructDeclaration.prototype.produce = EmptyProducer.prototype.produce
Grammar.StaticDeclaration.prototype.produce = EmptyProducer.prototype.produce
Grammar.UseDeclaration.prototype.produce = EmptyProducer.prototype.produce
Grammar.ModDeclaration.prototype.produce = EmptyProducer.prototype.produce
Grammar.ConstDeclaration.prototype.produce = EmptyProducer.prototype.produce
Grammar.TypeDeclaration.prototype.produce = EmptyProducer.prototype.produce
Grammar.MacroInvocation.prototype.produce = EmptyProducer.prototype.produce
Grammar.MatchExpression.prototype.produce = EmptyProducer.prototype.produce

class FunctionDeclarationWriter extends Grammar.FunctionDeclaration {

    produceContractAPI() :void{

        const o = this.owner.codeWriter
        if (!this.isPublic) {
            // o.writeLine(`NON-PUB fn ${this.name}`) //debug
            return // only pub fns are part of the ContractAPI
        }

        const fnName = this.name
        let isView = true
        if (fnName == 'new') {
            // always !isVew, doesn't have &[mut] self
            isView = false
        } else {
            const selfParam: Grammar.VariableDecl = this.paramsDeclarations.children[0] as Grammar.VariableDecl
            // pub fn(&mut self) are "calls" -- alter state
            // pub fn(&self) are views -- do not alter state
            isView = !(selfParam.isMut)
        }
        if (isView && this.commentsAndAttr.includes("#[init]")) {
            // it's the init/new pub fn
            isView = false
        }
        logger.debug(">>> " + (isView ? "[view]" : "[call]") + " pub fn " + fnName + this.paramsDeclarations.toString())

        // output pub fn comments
        // this.writeComments() -- no, they're include in the help string

        o.writeLine(`${fnName}_HELP(){ return \``) // start help declaration

        if (this.commentsAndAttr && this.commentsAndAttr.length) {
            for (let s of this.commentsAndAttr) {
                while (s.startsWith("/")) s = s.slice(1) // remove starting //
                if (s.endsWith("/")) s = s.slice(0, s.length - 1) // remove ending /
                o.writeLine(s.replace(/`/g, "'"))
            }
        }
        o.blankLine()

        // construct usage example from pub fn params
        let argsDecl = ""
        const hasJSONArguments = this.paramsDeclarations.children.length > 1 // 1st = 'self'
        if (hasJSONArguments) {
            o.write("{")
            let inx = 0
            for (const paramDecl of this.paramsDeclarations.children) {
                if (paramDecl.name !== 'self') { // rust 'self' is implicit 'this' in ts
                    if (inx > 0) o.write(", ")
                    paramDecl.produce()
                    inx++
                }
            }
            o.write("}")
        }
        argsDecl = o.getCurrentLine() // save line
        o.clearCurrentLine() // clear
        if (hasJSONArguments) {
            // ensure all { and } have spaces around
            argsDecl = argsDecl.replace(/\{/g, " { ")
            argsDecl = argsDecl.replace(/\}/g, " } ").trim()
        }

        o.writeLine("usage:")
        o.writeLine("> " + o.data.nickname + " " + fnName + " " + argsDecl)

        // Type Annotation -- remove
        /* let hasReturnValue = false;
        if (this.typeAnnotation) {
            if (this.typeAnnotation.name !== "Self") {
                this.typeAnnotation?.produce()
                hasReturnValue = true
            }
        }
        */

        const isPayable = (this.commentsAndAttr.includes("#[payable]"))

        // EXAMPLE -- for the user to add
        // o.blankLine()
        // o.writeLine("example:")
        // o.writeLine(PromptNickName + " " + argsDecl)
        // o.writeLine("this command will " + fnName)
        // o.blankLine()

        o.writeLine("`};") // close help string & help function
        o.blankLine()

        // function as method of ContractAPI
        o.write(fnName)
        o.writeLine(`(a /*:CommandLineArgs*/) /*:${isView?"string":"void"}*/{`) // API receives CommandLineArgs parser utlity
        o.indent += 2 // start body
        o.blankLine()

        if (isPayable) {
            o.writeLine("//function is #payable, --amount option is required")
            o.writeLine("a.requireOptionWithAmount(options.amount,'N'); //contract fn is payable, --amount expressed in N=NEARS is required")
        }

        // commented options for the user to expand
        o.writeLine('//--these are some examples on how to consume arguments')
        o.writeLine('//const toAccount = a.consumeString("to Account")')
        o.writeLine('//const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")')
        o.blankLine()

        // get JSON args for the fn
        if (hasJSONArguments) {
            o.writeLine('//get fn arguments as JSON')
            o.writeLine(`const fnJSONParams = a.consumeJSON("${argsDecl}")`)
        } else {
            o.writeLine(`//--${fnName} has no arguments, if you add some, uncomment the following line and send the params in this.call/view`)
            o.writeLine('//const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")')
        }
        o.blankLine()

        // standard end of args mark
        o.writeLine("a.noMoreArgs() // no more positional args should remain")
        o.blankLine()

        // make the view/call
        let invoke:string
        if (isView){
            invoke="return this.view"
        }
        else {
            invoke="this.call"
        }

        let invokeArgs = `"${fnName}"`
        if (hasJSONArguments) invokeArgs += ",fnJSONParams";

        o.writeLine(`${invoke}(${invokeArgs})`)
        o.blankLine()

        //end method
        o.indent -= 2 // end APi method body
        o.writeLine("}")
        o.blankLine()

    // rust contract pub fn Body
    // if (this.children.length) {
    //    o.write(' {')
    //    RustFnBodyWriter.prototype.produceBody.call(this, 4, hasReturnValue)
    //    o.writeLine('}')
    // }
    }
}
Grammar.FunctionDeclaration.prototype.produce = FunctionDeclarationWriter.prototype.produceContractAPI

export class TypeAnnotationWriter extends Grammar.TypeAnnotation {
    produceTS() :void {
        const o = this.owner.codeWriter
        o.write(": ")
        // this.optAddrOf()
        // this.optMut()
        let replaced = this.name.replace("::", ".")
        switch (replaced) {
        case 'str': replaced = "string"; break
        default:
        }
        o.write(replaced)
    // if (this.opt('<')) {
    //    this.children = this.reqSeparatedList(Identifier, ',', '>')
    // }
    }
}
Grammar.TypeAnnotation.prototype.produce = TypeAnnotationWriter.prototype.produceTS

export class VarDeclWriter extends Grammar.VariableDecl {
    produceTS() :void{
        const o = this.owner.codeWriter
        o.write(this.name)
        this.typeAnnotation?.produce()

        if (this.assignedExpression) {
            o.write(" = ")

            if (this.assignedExpression.name === 'env') { // rust 'env' => AS 'Context'
                o.write('Context.')

                switch (this.assignedExpression.root.name) {
                case 'env::signer_account_id':
                    o.write('sender')
                    break

                default:
                    this.assignedExpression.root.produce()
                }
            } else {
                this.assignedExpression.produce()
            }
        }
    }
}
Grammar.VariableDecl.prototype.produce = VarDeclWriter.prototype.produceTS

export class ExpressionWriter extends Grammar.Expression {
    produceTS() :void{
    // const o = this.owner.codeWriter
        this.root?.produce()
    }
}
Grammar.Expression.prototype.produce = ExpressionWriter.prototype.produceTS

export class ParenExpressionWriter extends Grammar.ParenExpression {
    produceTS() :void{
        const o = this.owner.codeWriter
        o.write("(")
        this.produceChildren()
        o.write(")")
    }
}
Grammar.ParenExpression.prototype.produce = ParenExpressionWriter.prototype.produceTS

export class LetStatementWriter extends Grammar.LetStatement {
    produceTS() :void{
        const o = this.owner.codeWriter
        o.write("let ")
        this.produceChildren(", ")
    }
}
Grammar.LetStatement.prototype.produce = LetStatementWriter.prototype.produceTS

export class VarRefWriter extends Grammar.VarRef {
    produceTS() :void{
        const o = this.owner.codeWriter
        if (this.name == 'self') {
            o.write('this')
        } else if (this.name == 'env::log') { // rust 'env::log' => AS logging.log
            o.write('logging.log')
        } else {
            o.write(this.name.replace("::", "."))
        }
        // accessors
        this.produceChildren()
    }
}
Grammar.VarRef.prototype.produce = VarRefWriter.prototype.produceTS

const superObjectLiteralProduce = Grammar.ObjectLiteral.prototype.produce
export class ObjectLiteralWriter extends Grammar.ObjectLiteral {
    produceTS() :void{
        const o = this.owner.codeWriter
        o.indent += 4
        superObjectLiteralProduce.call(this)
        if (this.name) { // "struct-instantiation") {
            o.write(` as ${this.name}`)
        }
        o.indent -= 4
    }
}
Grammar.ObjectLiteral.prototype.produce = ObjectLiteralWriter.prototype.produceTS

export class FunctionArgumentWriter extends Grammar.FunctionArgument {
    produceTS() :void{
        const o = this.owner.codeWriter
        if (this.expression) {
            this.expression.produce()
        } else {
            o.write("undefined") // rust _ wildcard argument
        }
    }
}
Grammar.FunctionArgument.prototype.produce = FunctionArgumentWriter.prototype.produceTS

// ---------------------------
// function outNativeRustConversionMapCollect(item: ASTBase) {
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
// }

export class RustClosureWriter extends Grammar.RustClosure {
    produceTS() :void{
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

// ---------------------------
export class IfStatementWriter extends Grammar.IfStatement {
    // conditional: Expression
    // ---------------------------
    produceTS() :void{
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

export class ContractAPIProducer {
    static produce(root: ASTBase, data: CodeWriterData, outFilename: string) :void{
        const parser: Parser = root.owner
        parser.codeWriter = new CodeWriter(outFilename, data)

        root.produce()

        parser.codeWriter.close()
    }
}
