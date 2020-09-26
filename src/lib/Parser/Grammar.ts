/* 
 * This Grammar is based on [Parsing Expression Grammars (PEGs)](http://en.wikipedia.org/wiki/Parsing_expression_grammar)
 * *with extensions*.
*/

//Grammar Meta-Syntax
//-------------------

//Each Grammar class, contains a 'grammar definition' as reference.
//The meta-syntax for the grammar definitions is an extended form of
//[Parsing Expression Grammars (PEGs)](http://en.wikipedia.org/wiki/Parsing_expression_grammar)

//The differences with classic PEG are:
//* instead of `Symbol <- definition`, we use `Symbol: definition` (colon instead of arrow)
//* we use `[Symbol]` for optional symbols instead of `Symbol?` (brackets also groups symbols, the entire group is optional)
//* symbols upper/lower case has meaning
//* we add `(Symbol,)` for `comma separated List of` as a powerful syntax option

//Meta-Syntax Examples:

//`function`     : all-lowercase means the literal word: "function"<br>
//`":"`              : literal symbols are quoted<br>
//`ReturnStatement`  : CamelCase is reserved for composed, non-terminal symbol<br>

//`IDENTIFIER`,`OPER` : all-uppercase denotes a entire class of symbols<br>
//`NEWLINE`,`EOF`     : or special unprintable characters<br>

//`[to]`               : Optional symbols are enclosed in brackets<br>
//`(var|let)`          : The vertical bar represents ordered alternatives<br>

//`(Oper Operand)`     : Parentheses groups symbols<br>
//`(Oper Operand)*`    : Asterisk after a group `()*` means the group can repeat (meaning one or more)<br>
//`[Oper Operand]*`    : Asterisk after a optional group `[]*` means *zero* or more of the group.<br>

//`[Expression,]` : means: "optional comma separated list of Expressions".<br>
//`Body: (Statement;)` : means "Body is a semicolon-separated list of statements".<br>

//Full Meta-Syntax Example:

//`PrintStatement: print [Expression,]`

//It reads: composed symbol `PrintStatement` is conformed by the word `print` followed by
//an _optional_ comma-separated list of `Expression`

//###More on comma-separated lists

//Let's analyze the example: `PrintStatement: print [Expression,]`

//`[Expression,]` means *optional* **comma "Separated List"** of Expressions.
//Since the comma is inside a **[ ]** group, it means the entire list is optional.

//Another example:

//`VariableDecl: IDENTIFIER ["=" Expression]`

//`VarStatement: var (VariableDecl,)`

//It reads: composed symbol `VarStatement` is conformed by the word `var` followed by
//a comma-separated list of `VariableDecl` (at least one)

//The construction `(VariableDecl,)` means: **comma "Separated List"** of `VariableDecl`

//Since the comma is inside a **( )** group, it means _at least one VariableDecl_ is required.

import { ASTBase } from './ASTBase'
import { logger } from '../util/logger'
import { TokenCode } from '../Lexer/Lexer'
import { Parser } from './Parser'
import { EOL } from 'os'

//Reserved Words
//---------------

//Words that are reserved and cannot be used as variable or function names
const RESERVED_WORDS = ['fn', 'async', 'class', 'if', 'then', 'else', 'null', 'true', 'false',
    'new', 'loop', 'while', 'crate', 'for', 'to', 'break', 'continue',
    'return', 'try', 'catch', 'throw', 'raise', 'fail', 'exception', 'finally',
    'mut', 'var', 'let',
    'yield', 'await', 'self', 'super', 'export',
    'async', 'short', 'long', 'int',
    'unsigned', 'void', 'null', 'bool', 'assert']

//Operators precedence
//--------------------
//The order of symbols here determines operators precedence
//var operatorsPrecedence = [
//'++','--', 'unary -', 'unary +', 'bitnot' ,'bitand', 'bitor', 'bitxor'
//,'>>','<<'
//,'new','type of','instance of','has property'
//,'*','/','%','+','-','&'
//,'into','in'
//,'>','<','>=','<=','is','<>','!==','like'
//,'no','not','and','but','or'
//,'?',':'
//]
const OPERATORS_PRECEDENCE = ['&', '&mut', '*',
    '!', '?',
    'unary -', 'unary +',
    'as',
    '*', '/', '%', '&', '|', '^', '>>', '<<',
    '+', '-',
    '==', '!=', '>', '<', '>=', '<=',
    '||', '&&',
    '..']

//--------------------------
//Grammar - AST Classes
//================================
//You'll find a class for each syntax construction the parser accepts


/**
 * can include namespace::namespace::name
 * */
export class Identifier extends ASTBase {
    // ---------------------------
    parse() {

        this.name = this.reqToken(TokenCode.WORD)
        while (this.opt('::')) {
            this.name += '::'
            this.name += this.reqToken(TokenCode.WORD)
        }
    }
}

//## Oper

//```
//Oper: ('~'|'&'|'^'|'|'|'>>'|'<<'
//|'*'|'/'|'+'|'-'|mod
//|instance of|instanceof
//|'>'|'<'|'>='|'<='
//|is|'==='|isnt|is not|'!=='
//|and|but|or
//|[not] in
//|(has|hasnt) property
//|? true-Expression : false-Expression)`
//```

//An Oper sits between two Operands ("Oper" is a "Binary Operator",
//different from *UnaryOperators* which optionally precede a Operand)

//If an Oper is found after an Operand, a second Operand is expected.

//Operators can include:
//* arithmetic operations "*"|"/"|"+"|"-"
//* boolean operations "and"|"or"
//* `in` collection check.  (js: `indexOx()>=0`)
//* instance class checks   (js: instanceof)
//* short-if ternary expressions ? :
//* bit operations (|&)
//* `has property` object property check (js: 'propName in object')

//    public class Oper extends ASTBase
// constructor
export class Oper extends ASTBase {
    negated
    left: Operand
    right: Operand
    pushed
    precedence
    intoVar
    // ---------------------------
    parse() {
        this.name = this.reqToken(TokenCode.OPERATOR)
        this.lock()

        //A) validate double-word opers

        //A.1) validate `instance of`

        //if .name is 'instance'
        if (this.name === 'instance') {

            //.req('of')
            this.req('of')
            //.name = "instance of"
            this.name = 'instance of'
        }
        //if .name is 'instance'

        else if (this.name === 'has') {

            //.negated = .opt('not')? true:false # set the 'negated' flag
            this.negated = this.opt('not') ? true : false
            //.req('property')
            this.req('property')
            //.name = "has property"
            this.name = 'has property'
        }
        //else if .name is 'has'

        else if (this.name === 'hasnt') {

            //.req('property')
            this.req('property')
            //.negated = true # set the 'negated' flag
            this.negated = true
            //.name = "has property"
            this.name = 'has property'
        }
        //else if .name is 'hasnt'

        else if (this.name === 'not') {

            //.negated = true # set the 'negated' flag
            this.negated = true
            //.name = .req('in','like') # require 'not in'|'not like'
            //this.name = this.req('in', 'like');
        }

        //A.4) handle 'into [var] x', assignment-Expression

        //if .name is 'into' and .opt('var')
        if (this.name === 'into' && this.opt('var')) {

            //.intoVar = '*r' //.right operand is "into" var
            this.intoVar = '*r'
            //.getParent(Statement).intoVars = true #mark owner statement
            // this.getParent(Statement).intoVars = true;
        }

        else if (this.name === 'isnt') {

            // set the 'negated' flag
            this.negated = true
            //treat as 'Negated is'
            this.name = 'is'
        }

        //else if .name is 'isnt'
        else if (this.name === 'instanceof') {

            //.name = 'instance of'
            this.name = 'instance of'
        }

        //C) Variants on 'is/isnt...'
        //if .name is 'is' # note: 'isnt' was converted to 'is {negated:true}' above
        if (this.name === 'is') {
            //C.1) is not<br>
            //Check for `is not`, which we treat as `isnt` rather than `is ( not`.

            //if .opt('not') # --> is not/has not...
            if (this.opt('not')) {

                //if .negated, .throwError '"isnt not" is invalid'
                if (this.negated) { this.throwError('"isnt not" is invalid') }
                //.negated = true # set the 'negated' flag
                this.negated = true
            }

            //end if

            //C.2) accept 'is/isnt instance of' and 'is/isnt instanceof'

            //if .opt('instance')


            //C.2) accept 'is/isnt instance of' and 'is/isnt instanceof'

            //if .opt('instance')
            if (this.opt('instance')) {

                //.req('of')
                this.req('of')
                //.name = 'instance of'
                this.name = 'instance of'
            }
            //if .opt('instance')

            else if (this.opt('instanceof')) {
                //this.name = 'instance of'
            }

        }

        //Get operator precedence index
        this.getPrecedence()
    }

    // ---------------------------
    getPrecedence = function () {
        this.precedence = OPERATORS_PRECEDENCE.indexOf(this.name)
        if (this.precedence === -1) {
            this.sayErr(`OPER '${this.name}' not found in the operator precedence list`)
        }
    }

    //----------------
    produce() {
        this.left?.produce()
        this.owner.codeWriter.write(' ' + this.name + ' ')
        this.right?.produce()
    }
}
// end class Oper

//public class UnaryOper extends Oper
// constructor
export class UnaryOper extends Oper {
    // ---------------------------
    parse() {
        this.name = this.reqOneOf(['+', '-', '!'])
        //Lock, we have a unary oper
        this.lock()

        //Rename - and + to 'unary -' and 'unary +',
        //if .name is '-'
        if (this.name == '-' || this.name == '+') {
            this.precedence = 0
        }
        else {
            //calculate precedence - Oper.getPrecedence()
            this.getPrecedence()
        }
    }
}
// end class UnaryOper



//## NumberLiteral
//`NumberLiteral: [0-9_.u] | '0x[0-9a-fA-F] | 0b[0-1][u0-9] `
export class NumberLiteral extends ASTBase {
    tokenCode: TokenCode //save token format: decimal, hexa, binary
    // ---------------------------
    parse() {
        this.tokenCode = this.owner.lexer.token.tokenCode
        this.name = this.reqList([TokenCode.NUMBER, TokenCode.HEXANUMBER, TokenCode.BINARYNUMBER]) as string
        Expression.checkNativeRustConversionMapCollect(this) //veo si tiene una llamada a .to_vec() u otra conversi�n
    }
}
// end class NumberLiteral


//## StringLiteral
//`StringLiteral: '"' [ any* | '\"' ] '"' | ''' [ any* | '\'' ] '''
//A string constant token. Can be anything the lexer supports, including single or double-quoted strings.
//The token include the enclosing quotes
export class StringLiteral extends ASTBase {
    // ---------------------------
    parse() {
        this.name = this.reqToken(TokenCode.LITERAL_STRING)
        Expression.checkNativeRustConversionMapCollect(this) //veo si tiene una llamada a .to_vec() u otra conversi�n
    }
    // ---------------------------
    unquoted(): string {
        return this.name.slice(1, -1)
    }
}
// end class StringLiteral

//## RegExpLiteral
//`RegExpLiteral: REGEX`
//A regular expression token constant. Can be anything the lexer supports.
export class RegExpLiteral extends ASTBase {
    // ---------------------------
    parse() {
        this.name = this.reqToken(TokenCode.LITERAL_STRING)
        Expression.checkNativeRustConversionMapCollect(this) //veo si tiene una llamada a .to_vec() u otra conversi�n
    }
}
// end class RegExpLiteral

export class Operand extends ASTBase {
    //-------------------------
    //value is at children[0]
    // -------------------------
    parse() {

        //Let's look for operands in a expression, i.e: "a" and "b" in  "a+b*5"

        const t = this.owner.lexer.token

        if ([TokenCode.NUMBER, TokenCode.HEXANUMBER, TokenCode.BINARYNUMBER].includes(t.tokenCode)) {
            this.children.push(this.reqClass(NumberLiteral))
            return //**** early exit
        }
        if (t.tokenCode == TokenCode.LITERAL_STRING) {
            this.children.push(this.reqClass(StringLiteral))
            return //**** early exit
        }

        if (t.value == "match") {//Rust match expression
            this.name = 'match'
            this.children.push(this.reqClass(MatchExpression))
            return //**** early exit
        }

        if (t.value == "(") { // parent expression
            this.name = 'parentized'
            this.children.push(this.reqClass(ParenExpression))
            return //**** early exit
        }

        //here, the OPERAND is a var reference, fn-call or macro!
        this.owner.lexer.savePosition()
        const vr = this.reqClass(VarRef)

        //let's see if this is a macro! invocation
        if (this.owner.lexer.token.value == '!') { //it's a macro!
            this.owner.lexer.restoreSavedPosition()
            this.keyword = "macro!"
            this.name = vr.name
            this.children.push(this.reqClass(MacroInvocation))
            return //**** early exit
        }

        //it's not a macro, last options are var reference or fn-call 
        //the vr is good for both
        this.owner.lexer.discardSavedPosition()

        //let's see if this is a struct instantiation expression
        //rust's struct instantiation can only be detected by 'Self {...' or 'Declared-Struct-Type-Name {...' used as a statement
        //ojo ambiguos if we're in [match expr '{' ... '}' ] - commented
        if (this.owner.lexer.token.value == "{"
            && this.parent.parent.name != 'match'
            && this.parent.parent.name != 'if'
        ) { //it's a struct Instantiation
            const objectLiteral = this.reqClass(ObjectLiteral)
            objectLiteral.name = vr.name
            objectLiteral.keyword = "struct-instantiation"
            this.children.push(objectLiteral)
            return //**** early exit
        }

        //last option, this is just a varRef acting as a expression
        this.name = vr.name
        this.children.push(vr)
    }

    //--------
    produce() {
        this.produceChildren();
    }
}
// end class Operand

export class FunctionArgument extends ASTBase {
    expression: Expression
    // ---------------------------
    parse() {
        this.lock()
        if (this.owner.lexer.token.value == "_") { //  _ => wildcard, ignore param
            this.name = "_"
            this.owner.lexer.advance()
            return //early exit
        }
        this.optAddrOf()
        this.optMut()
        this.expression = this.reqClass(Expression) as Expression
    }
}// end class FunctionArgument

//-----------
//## Expression

//`Expression: [UnaryOper] Operand [Oper [UnaryOper] Operand]*`

//The expression class parses intially a *flat* array of nodes.
//After the expression is parsed, a *Expression Tree* is created based on operator precedence.

//public class Expression extends ASTBase
// constructor
export class Expression extends ASTBase {
    root: UnaryOper | Oper | Operand
    operandCount
    ternaryCount
    // ---------------------------
    parse() {

        const arr = []
        this.operandCount = 0
        this.ternaryCount = 0

        //(performance) Fast exit for no-expression `);{` => end of expression.
        if (');}'.includes(this.owner.lexer.token.value)) {
            return //early exit
        }

        while (true) {

            //Get optional unary operator
            //(performance) check token first

            if (['+', '-', '!'].includes(this.owner.lexer.token.value)) {
                const unaryOper = this.opt(UnaryOper)
                if (unaryOper) {
                    arr.push(unaryOper)
                    this.lock()
                }
            }

            //Get operand
            arr.push(this.reqClass(Operand))
            this.operandCount++
            this.lock()

            //(performance) Fast exit for common tokens: `=> = , ] ) ; { ` => end of expression.
            if (this.owner.lexer.token.value == "=>" || '=,]);{'.includes(this.owner.lexer.token.value)) {
                break //early exit
            }

            //Try to parse next token as an operator
            const oper = this.opt(Oper)
            //if no oper then break # no more operators, end of expression
            if (!oper) { break }

            //If it was an operator, store, and continue because we expect another operand.
            //(operators sits between two operands)
            arr.push(oper)
        }


        ////Fix 'new' calls. Check parameters for 'new' unary operator, for consistency, add '()' if not present,
        ////so `a = new MyClass` turns into `a = new MyClass()`
        //for (let index = 0, item; index < arr.length; index++) {
        //    item = arr[index]
        //    //if item instanceof UnaryOper and item.name is 'new'
        //    if (item instanceof UnaryOper && item.name === 'new') {
        //        const operand = arr[index + 1]
        //        if (operand.name instanceof VarRef) {
        //            const valueRef = operand.name
        //            //if no varRef.executes, varRef.addAccessor new FunctionAccess(this)
        //            if (!valueRef.executes) { valueRef.addAccessor(new FunctionAccess(this, '')) }
        //        }
        //    }
        //}// end for each in arr

        //Now we create a tree from .arr[], based on operator precedence
        //.growExpressionTree(arr)
        this.growExpressionTree(arr)
    }

    // ---------------------------
    growExpressionTree = function (arr) {

        //do while arr.length > 1
        while (arr.length > 1) {

            //find the one with highest precedence (lower number) to push down
            //(on equal precedende, we use the leftmost)

            let pos = -1
            let minPrecedenceInx = 100
            for (let inx = 0, item; inx < arr.length; inx++) {
                item = arr[inx]


                //debug "item at #{inx} #{item.name}, Oper? #{item instanceof Oper}. precedence:",item.precedence

                if (item instanceof Oper) {

                    //if not item.pushed and item.precedence < minPrecedenceInx
                    if (!(item.pushed) && item.precedence < minPrecedenceInx) {
                        pos = inx
                        minPrecedenceInx = item.precedence
                    }
                }
            }
            //end for

            //#control
            if (pos < 0) {
                this.throwError("can't find highest precedence operator")
            }

            //Un-flatten: Push down the operands a level down
            const oper = arr[pos]
            oper.pushed = true
            if (oper instanceof UnaryOper) {
                //#control
                if (pos === arr.length) {
                    this.throwError(`can't get RIGHT operand for unary operator '${oper}'`)
                }

                //# if it's a unary operator, take the only (right) operand, and push-it down the tree
                oper.right = arr.splice(pos + 1, 1)[0]
            }

            else {
                //#control
                if (pos === arr.length) {
                    this.throwError(`can't get RIGHT operand for binary operator '${oper}'`)
                }
                if (pos === 0) {
                    this.throwError(`can't get LEFT operand for binary operator '${oper}'`)
                }

                //# if it's a binary operator, take the left and right operand, and push them down the tree
                oper.right = arr.splice(pos + 1, 1)[0]
                oper.left = arr.splice(pos - 1, 1)[0]
            }

            //loop #until there's only one operator
        }

        //Store the root operator
        this.root = arr[0]
    }

    static checkNativeRustConversionMapCollect(node: ASTBase) {
        if (node.tokVal() == ".") {
            node.nativeSuffixes = node.reqClass(RustNativeSuffixes)
        }
    }
}
// end class Expression

export class RustNativeSuffixes extends ASTBase {
    // ---------------------------
    parse() {
        //veo si al final de la expresion hay uno o mas .into() o .as_u128() .to_vec() .map() . collect() etc, 
        // que son sufijos de conversiones de rust y de map()

        while (this.owner.lexer.token.value == '.') {
            this.owner.lexer.advance()
            const suffix = this.reqClass(Identifier)
            this.req("(")
            if (suffix.name == "map") { //.map() param is a closure
                suffix.reqChild(RustClosure)
            }
            else if (this.tokVal() != ')') { //has parameters
                suffix.reqChild(Expression)
            }
            this.req(")")
        }

    }

}


//## NameValuePair
//`NameValuePair: (IDENTIFIER|StringLiteral|NumberLiteral) ':' Expression`
//A single item inside a `ObjectLiteral / StructInstantiation.value`
//a `property-name: value` pair.
export class NameValuePair extends ASTBase {
    value: Expression
    // ---------------------------
    parse() {
        this.owner.lexer.savePosition()
        this.name = this.reqToken(TokenCode.WORD)
        if (this.opt(':')) { //por alguna razon en rust decidieron q se podia instanciar un obj por posicion, los : son opcionales
            this.owner.lexer.discardSavedPosition()
            this.lock()
            this.value = this.reqClass(Expression) as Expression
        }
        else {
            //asumpo posicional
            this.owner.lexer.restoreSavedPosition()
            this.name = "[positional]"
            this.value = this.reqClass(Expression) as Expression
        }
    }
    // ---------------------------
    produce() {
        this.owner.codeWriter.write(this.name)
        this.owner.codeWriter.write(" : ")
        this.value.produce()
    }
}
// end class NameValuePair

//## ObjectLiteral

//`ObjectLiteral: '{' NameValuePair* '}'`

//Defines an object with a list of key value pairs. This is a JavaScript-style definition.
//For LiteC (the Litescript-to-C compiler), a ObjectLiteral crates a `Map string to any` on the fly.

//`x = {a:1,b:2,c:{d:1}}`

//public class ObjectLiteral extends Literal
// constructor
export class ObjectLiteral extends ASTBase {

    // ---------------------------
    parse() {
        this.req('{')
        this.lock()
        this.children = this.optSeparatedList(NameValuePair, ',', '}')

        Expression.checkNativeRustConversionMapCollect(this) //veo si tiene una llamada a .to_vec() u otra conversi�n
    }

    // ---------------------------
    forEach(callback: Function) {
        //for each nameValue in .items
        for (const nameValue of this.children) {
            callback(nameValue)
        }
    }

    // ---------------------------
    produce() {
        this.owner.codeWriter.write("{")
        this.produceChildren(","+EOL)
        this.owner.codeWriter.write("}")
    }

}

export class StaticDeclaration extends ASTBase {
    valueExpression: Expression
    // ---------------------------
    parse() {
        this.req('static')
        //At this point we lock because it is definitely a `static` declaration. Failure to parse the expression
        //from this point is a syntax error.
        this.lock()
        //After the word 'static' we require an identifier:type=value
        this.name = this.reqToken(TokenCode.WORD)
        this.req(":")
        this.reqChild(TypeAnnotation)
        this.req("=")
        this.reqChild(Expression)
    }
}
// end static place declaration

//## ArrayLiteral
//`ArrayLiteral: '[' (Expression,)* ']'`
//An array definition, such as `a = [1,2,3]`
export class ArrayLiteral extends ASTBase {
    items: Expression[] = []
    // ---------------------------
    parse() {
        this.req('[')
        this.lock()
        //closer "]" required
        this.items = this.optSeparatedList(Expression, ',', ']') as Expression[]
    }
}// end class ArrayLiteral



export class ConstDeclaration extends ASTBase {
    // ---------------------------
    parse() {

        this.req('const')
        //At this point we lock because it is definitely a `const` declaration. Failure to parse the expression
        //from this point is a syntax error.
        this.lock()
        //After the word 'const' we require an identifier
        this.name = this.reqToken(TokenCode.WORD)
        this.req(":")
        this.reqChild(TypeAnnotation)
        this.req("=")
        this.reqChild(Expression)
    }
}
// end ConstValueDeclaration



//## ParenExpression
//`ParenExpression: '(' Expression ')'`
//An expression enclosed by parentheses, like `(a + b)`.
//public class ParenExpression extends ASTBase
// constructor
export class ParenExpression extends ASTBase {
    expr: Expression
    // ---------------------------
    parse() {
        this.req('(')
        this.lock()
        this.reqChild(Expression)
        this.req(')')

        Expression.checkNativeRustConversionMapCollect(this) //veo si tiene una llamada a .to_vec() u otra conversi�n
    }
}
// end class ParenExpression



/**
 * a type annotation with optional <type-paramenters,...>
 *      IDENT [ '<' (type-paramenter,) '>' ]
 * */
export class TypeAnnotation extends ASTBase {
    parse() {
        this.optAddrOf()
        this.optMut()
        const ident = this.reqClass(Identifier)
        this.name = ident.name //composed::namespace::name
        if (this.opt('<')) {
            this.children = this.reqSeparatedList(Identifier, ',', '>')
        }
    }
}


/**
 * class UseDeclaration
 *      'use' WORD ([::WORD...]  | '{' (Identifier,) '}' | * )
 * */
export class UseDeclaration extends ASTBase {
    // ---------------------------
    parse() {
        this.req('use')
        this.lock()
        this.name = this.reqToken(TokenCode.WORD)
        while (this.owner.lexer.token.value == '::') {
            this.name += '::'
            const nextValue = this.owner.lexer.advance()
            if (nextValue == '{') { //special rust case, several use declarations sharing the same root
                this.owner.lexer.advance()
                this.children = this.reqSeparatedList(Identifier, ",", "}")
                break //no more ::'s possible
            }
            else if (nextValue == '*') { //special: all items
                this.name += '*'
                this.owner.lexer.advance()
                break //no more ::'s possible
            }
            else { //more indentifiers
                this.name += this.reqToken(TokenCode.WORD)
            }
        }
    }
}

export class ModDeclaration extends ASTBase {
    // ---------------------------
    parse() {
        this.req('mod')
        this.lock()
        this.name = this.reqToken(TokenCode.WORD)
        Body.optIntoChildren(this)
    }
}

export class TypeDeclaration extends ASTBase {
    // ---------------------------
    parse() {
        this.req('type')
        this.lock()
        this.name = this.reqToken(TokenCode.WORD)
        this.req('=')
        this.reqChild(Expression)
    }
}

export class MacroInvocation extends ASTBase {
    macroWords: string[] = []
    // ---------------------------
    parse() {
        this.name = this.reqToken(TokenCode.WORD)
        this.name += this.req('!')
        this.lock()

        //casos especiales de rust de como delimitan los parametros de la macro
        const initial = this.owner.lexer.token.value
        let opener = initial, closer: string
        if (initial == '{') {
            closer = '}'
        }
        else if (initial == '(') {
            closer = ')'
        }
        else if (initial == '[') {
            closer = ']'
        }
        else {
            opener = undefined
            closer = ';'
        }

        //special recognized macros: assert_eq!(a,b) => expect(a).toBe(b)
        if (this.name == "assert_eq!" && opener == "(") {
            //parse the 2 expression and store at children[]
            this.req("(")
            this.reqChild(Expression)
            this.req(",")
            this.reqChild(Expression)
            if (this.opt(",")){ //third parameter, message if asssert failed
                this.reqChild(Expression)
            }
            this.req(")")
        }
        else {
            //read balanced openers/closers { } / () or up to ;
            //because it's a "macro" anything goes (can't use AST Body parser)
            this.macroWords.push(initial)
            let openBalance = 1
            do {
                const word = this.owner.lexer.advance()
                if (opener && word == opener) { openBalance++ }
                else if (word == closer) { openBalance-- }
                this.macroWords.push(word)
            }
            while (openBalance > 0)
            this.owner.lexer.advance() // consume the closer
        }


        //check if the macro!() ends with .into() .as_bytes() .as_U128() etc
        Expression.checkNativeRustConversionMapCollect(this)

        this.owner.lexer.semiNotRequired = true // no need for a semicolon after this
    }

    toString() {
        return Function.apply(ASTBase.toString, this) + ' ' + this.macroWords.join(' ')
    }
}

export class StructDeclaration extends ASTBase {
    // ---------------------------
    parse() {
        this.req('struct')
        this.name = this.reqToken(TokenCode.WORD)
        this.req('{')
        this.children = this.reqSeparatedList(VariableDecl, ",", "}")
    }
}

export class ImplDeclaration extends ASTBase {
    for: Identifier
    // ---------------------------
    parse() {
        this.req('impl')
        this.lock()
        this.name = this.reqToken(TokenCode.WORD)
        if (this.opt('for')) {
            this.for = this.reqClass(Identifier)
        }
        this.req("{")
        Body.parseIntoChildren(this) //parse as a Body (no separator, several fn { } blocks) => children
    }
}


/**
 * A single-line attribute
 * comments attached to statements are stored in Statement.comment
 * */
export class LineAttribute extends ASTBase {
    parse() {
        this.name = this.reqToken(TokenCode.ATTRIBUTE)
    }
}

//## RustClosure
//
//`RustClosure: ` '|' (WORD,...) '|' ( Body | Expression | fn-call ) `
//
export class RustClosure extends ASTBase {
    mapItemName: string
    params: Identifier[]

    // ---------------------------
    parse() {
        this.req('|')
        this.lock()
        this.params = this.reqSeparatedList(Identifier, ",", "|") //closure params
        // it's a body?
        if (this.opt('{')) {
            Body.parseIntoChildren(this)
        }
        else {
            //let's assume it is an Expression
            this.children.push(this.reqClass(Expression))
        }
    }
}
// end class RustClosure


//## MatchPair
//
//`MatchPair: ` (Expression | '_' ) '=>' Expression 
//
export class MatchPair extends ASTBase {
    left: Expression
    right: Expression
    // ---------------------------
    parse() {
        if (this.opt('_')) {
            this.left = null
        }
        else {
            this.left = this.reqClass(Expression) as Expression
        }
        this.req("=>")
        this.right = this.reqClass(Expression) as Expression
    }

    toString() {
        return Function.apply(ASTBase.toString, this) + (this.left ? this.left.name : '_') + " => " + this.right.name
    }
}

//## MatchExpression
//
//`MatchExpression: ` match Expression '{' ( (Expression | '_' ) => Expression ,... ) '}'`
//
export class MatchExpression extends ASTBase {
    exprToMatch: Expression
    // ---------------------------
    parse() {
        this.req('match')
        this.lock()
        this.exprToMatch = this.reqClass(Expression) as Expression
        this.req('{')
        this.children = this.optSeparatedList(MatchPair, ",", "}")

        Expression.checkNativeRustConversionMapCollect(this) //veo si tiene una llamada a .to_vec() u otra conversi�n
    }
}
// end class MatchExpression


//## FunctionDeclaration
//
//`FunctionDeclaration: 'function [IDENTIFIER] ["(" [VariableDecl,]* ")"] [returns type-VariableRef] Body`
//
//Functions: parametrized pieces of callable code.
//
export class FunctionDeclaration extends ASTBase {
    paramsDeclarations: FunctionParameters

    // ---------------------------
    parse() {

        //manage special keywords like 'pub'
        this.optPub()

        this.req('fn')
        this.lock()
        this.name = this.reqToken(TokenCode.WORD)

        //.parseParametersAndBody
        this.parseParametersAndBody()
    }

    // ---------------------------
    parseParametersAndBody() {

        //This method is shared by functions, methods and constructors.
        //`()` after `function` are optional. It parses: `'(' [VariableDecl,] ')' '->' Return-TypeAnnotation '{' Body '}'`

        //get parameters declarations
        this.paramsDeclarations = this.opt(FunctionParameters) as FunctionParameters

        // get the return-type (optional)
        if (this.opt('->')) {
            this.typeAnnotation = this.reqClass(TypeAnnotation)
        }

        //now parse the body
        if (this.owner.lexer.token.value == ";") {
            //just a fn signature declaration (no body)
            return
        }
        else {
            this.req("{")
            Body.parseIntoChildren(this)
        }
    }
}
// end class FunctionDeclaration

/**
 * [pub mut &] Name,Type and optional assignment
 * 
 * Identifier: TypeAnnotation [ = Expression ]
 * 
 * */
export class VariableDecl extends ASTBase {
    typeAnnotation: TypeAnnotation
    assignedExpression: Expression
    // ---------------------------
    parse() {

        // accept '...' to denote a variadic function
        //if (this.owner.tokenizer.token.value === '...' && this.parent instanceof FunctionParameters) {
        //    this.name = this.req('...');
        //    return;
        //};

        //manage special keywords like 'pub' & mut
        this.optPub()
        this.optAddrOf()
        this.optMut()

        this.name = this.reqToken(TokenCode.WORD)
        this.lock()

        //if .parent instance of VarStatement
        if (this.parent instanceof LetStatement && RESERVED_WORDS.indexOf(this.name) >= 0) {
            this.sayErr(`"${this.name}" is a reserved word`)
        }

        //optional type annotation 
        if (this.opt(':')) {
            this.typeAnnotation = this.reqClass(TypeAnnotation) as TypeAnnotation
        }

        //optional assigned value
        if (this.opt('=')) {
            this.assignedExpression = this.reqClass(Expression) as Expression
        }
    }
}
// end class VariableDecl


//export class VarDeclList extends ASTBase {
//    list: VariableDecl[]
//    // ---------------------------
//    parseList(closer:string) {
//        this.list = this.reqSeparatedList(VariableDecl, ',', closer) as VariableDecl[]
//    }
//    // ---------------------------
//    getNames = function () {
//        var result = []
//        for (const varDecl of this.list) {
//            result.push(varDecl.name)
//        }
//        return result
//    }
//}
//// end class VarDeclList

export class LetStatement extends ASTBase {
    // ---------------------------
    parse() {
        this.req('let')
        this.optMut()
        this.lock()
        this.children = this.reqSeparatedList(VariableDecl, ',', ';')
    }
}

// constructor
export class FunctionParameters extends ASTBase {
    // ---------------------------
    parse() {

        //if we define a list of specific parameters, fuction is no longer variadic
        this.lock()

        this.req('(')
        this.children = this.optSeparatedList(VariableDecl, ',', ')') as VariableDecl[]

        ////check if we've parsed "..." ellipsis in the parameters list.
        ////ellipsis are valid as "last parameter", and restores the "variadic" flag
        ////for each inx,item in .list
        //for (let [inx, item] of this.list) {

        //    //if item.name is '...'
        //    if (item.name === '...') {

        //        //if inx<.list.length-1
        //        if (inx < this.list.length - 1) {

        //            //.sayErr "variadic indicator: '...' is valid only as last parameter"
        //            this.sayErr('variadic indicator: "..." is valid only as last parameter');
        //        }
        //        //if inx<.list.length-1

        //        else {
        //            //.list.pop //remove "..."
        //            this.list.pop();
        //            //.variadic = true
        //            this.variadic = true;
        //            //break
        //            break;
        //        };
        //    };
        //};// end for each in this.list

    }
}// end class FunctionParameters

//public class TraitDeclaration extends ASTBase
// constructor
export class TraitDeclaration extends ASTBase {
    traitAncestors: Identifier[]
    // ---------------------------
    parse() {
        this.req('trait')
        this.lock()
        this.name = this.reqToken(TokenCode.WORD)

        //See if there is an inheritance declaration
        if (this.opt(':')) {
            // now a list of references (to other traits, separated by "+", ended by the "{" )
            this.traitAncestors = this.reqSeparatedList(Identifier, '+', '{')
        }

        //Now get the trait body
        this.req("{")
        Body.parseIntoChildren(this)
    }
}
// end class TraitDeclaration


//    export class TryCatch extends ASTBase
// constructor
export class TryCatch extends ASTBase {
    exceptionBlock
    // ---------------------------
    parse() {
        this.req('try')
        this.lock()
        Body.reqAsChild(this, "try-block")
        if (this.opt('catch')) {
            Body.reqAsChild(this, "catch-block")
        }
        if (this.opt('finally')) {
            Body.reqAsChild(this, "finally-block")
        }
    }
}

export class ThrowStatement extends ASTBase {
    // ---------------------------
    parse() {
        this.req('throw')
        //At this point we lock because it is definitely a `throw` statement
        this.lock()
        this.reqChild(Expression)
    }
}
// end class ThrowStatement

/**
 * 'return' [Expression]
 * */
export class ReturnStatement extends ASTBase {
    expr: Expression
    // ---------------------------
    parse() {
        this.req('return')
        this.lock()
        this.optChild(Expression)
    }
}
// end class ReturnStatement


// ---------------------------
export class IfStatement extends ASTBase {
    conditional: Expression
    // ---------------------------
    parse() {
        this.req('if')
        this.lock()
        this.conditional = this.reqClass(Expression) as Expression
        Body.reqAsChild(this, "then-block") //first child, then block
        if (this.opt('else')) {
            Body.reqAsChild(this, "else-block") //second child, optional else block
        }
    }
}
// end class IfStatement


// ---------------------------
export class WhileStatement extends ASTBase {
    conditional: Expression
    // ---------------------------
    parse() {
        this.req('while')
        this.lock()
        this.conditional = this.reqClass(Expression) as Expression
        this.req("{")
        Body.parseIntoChildren(this)
    }
    toString() {
        return Function.apply(ASTBase.toString, this) + ' ' + this.conditional.name
    }
}
// end class WhileStatement 


//export class ElseIfStatement extends ASTBase {
//    nextIf
//    // ---------------------------
//    parse () {
//        //.req 'else'
//        this.req('else');
//        //.req 'if'
//        this.req('if');
//        //.lock()
//        this.lock();

//        //return the consumed 'if', to parse as a normal `IfStatement`

//        //.lexer.returnToken()
//        this.lexer.returnToken();
//        //.nextIf = .req(IfStatement)
//        this.nextIf = this.req(IfStatement);
//    }
//}// end class ElseIfStatement


//Loops
//=====
/*
export class DoLoop extends ASTBase {
    preWhileUntilExpression
    body
    postWhileUntilExpression
    // ---------------------------
    parse () {
        //.req 'do'
        this.req('do');
        //if .opt('nothing')
        if (this.opt('nothing')) {

            //.throwParseFailed('is do nothing')
            this.throwParseFailed('is do nothing');
        };
        //.opt ":"
        this.opt(':');
        //.lock()
        this.lock();

        //Get optional pre-condition

        //.preWhileUntilExpression = .opt(WhileUntilExpression)
        this.preWhileUntilExpression = this.opt(WhileUntilExpression);
        //.body = .opt(Body)
        this.body = this.opt(Body);
        //.req "loop"
        this.req('loop');

        //Get optional post-condition

        //.postWhileUntilExpression = .opt(WhileUntilExpression)
        this.postWhileUntilExpression = this.opt(WhileUntilExpression);
        //if .preWhileUntilExpression and .postWhileUntilExpression
        if (this.preWhileUntilExpression && this.postWhileUntilExpression) {

            //.sayErr "Loop: cannot have a pre-condition a and post-condition at the same time"
            this.sayErr('Loop: cannot have a pre-condition a and post-condition at the same time');
        };
    }
}// end class DoLoop


//    export class WhileUntilLoop extends DoLoop
// constructor
export class WhileUntilLoop extends DoLoop {
    // ---------------------------
    parse () {
        //.preWhileUntilExpression = .req(WhileUntilExpression)
        this.preWhileUntilExpression = this.req(WhileUntilExpression);
        //.lock()
        this.lock();
        //.body = .opt(Body)
        this.body = this.opt(Body);
    }
}// end class WhileUntilLoop


//    export helper class WhileUntilExpression extends ASTBase
// constructor
export class WhileUntilExpression extends ASTBase {
    expr: Expression
    // ---------------------------
    parse () {
        //.name = .req('while','until')
        this.name = this.req('while', 'until');
        //.lock()
        this.lock();
        //.expr = .req(Expression)
        this.expr = this.req(Expression);
    }
}// end class WhileUntilExpression


//    export class LoopControlStatement extends ASTBase
// constructor
export class LoopControlStatement extends ASTBase {
    control
    // ---------------------------
    parse () {
        //.control = .req('break','continue')
        this.control = this.req('break', 'continue');
        //.opt 'loop'
        this.opt('loop');
    }
}// end class LoopControlStatement

//    export class DoNothingStatement extends ASTBase
// constructor
export class DoNothingStatement extends ASTBase {
    // ---------------------------
    parse () {
        //.req 'do'
        this.req('do');
        //.req 'nothing'
        this.req('nothing');
    }
}// end class DoNothingStatement
*/

//## For Statement
export class ForStatement extends ASTBase {
    variant: ASTBase
    // ---------------------------
    parse() {
        //We start with commonn `for` keyword
        this.req('for')
        this.lock()

        //we now require one of the variants
        //.variant = .req(ForEachProperty,ForEachInArray,ForIndexNumeric)
        //this.variant = this.req(ForEachProperty, ForEachInArray, ForIndexNumeric);
    }
}// end class ForStatement

/*
//##Variant 1) **for each [own] property**
//###Loop over **object property names**

//Grammar:
//`ForEachProperty: for each [own] property name-VariableDecl ["," value-VariableDecl] in object-VariableRef [where Expression]`

//where `name-VariableDecl` is a variable declared on the spot to store each property name,
//and `object-VariableRef` is the object having the properties

//    export class ForEachProperty extends ASTBase
// constructor
export class ForEachProperty extends ASTBase {
    keyIndexVar: VariableDecl
    valueVar: VariableDecl
    iterable: Expression
    where: ForWhereFilter
    body
    ownKey
    // ---------------------------
    parse () {
        //.req('each')
        this.req('each');

        //optional "own"

        //if .opt("own") into .ownKey
        if ((this.ownKey = this.opt('own'))) {

            //.lock()
            this.lock();
        };

        //next we require: 'property', and lock.

        //.req('property')
        this.req('property');
        //.lock()
        this.lock();

        //Get main variable name (to store property value)

        //.valueVar = .req(VariableDecl)
        this.valueVar = this.req(VariableDecl);

        //if comma present, it was propName-index (to store property names)

        //if .opt(",")
        if (this.opt(',')) {

            //.keyIndexVar = .valueVar
            this.keyIndexVar = this.valueVar;
            //.valueVar = .req(VariableDecl)
            this.valueVar = this.req(VariableDecl);
        };

        //Then we require `in`, and the iterable-Expression (a object)

        //.req 'in'
        this.req('in');
        //.iterable = .req(Expression)
        this.iterable = this.req(Expression);

        //optional where expression (filter)

        //.where = .opt(ForWhereFilter)
        this.where = this.opt(ForWhereFilter);

        //Now, get the loop body

        //.body = .req(Body)
        this.body = this.req(Body);
    }
}// end class ForEachProperty


//##Variant 2) **for each in**
//### loop over **Arrays**

//Grammar:
//`ForEachInArray: for each [index-VariableDecl,]item-VariableDecl in array-VariableRef [where Expression]`

//where:
//* `index-VariableDecl` is a variable declared on the spot to store each item index (from 0 to array.length)
//* `item-VariableDecl` is a variable declared on the spot to store each array item (array[index])
//and `array-VariableRef` is the array to iterate over

//    export class ForEachInArray extends ASTBase
// constructor
export class ForEachInArray extends ASTBase {
    intIndexVar: VariableDecl
    keyIndexVar: VariableDecl
    valueVar: VariableDecl
    iterable: Expression
    where: ForWhereFilter
    body
    // ---------------------------
    parse () {

        //first, require 'each'

        //.req 'each'
        this.req('each');

        //Get value variable name.
        //Keep it simple: index and value are always variables declared on the spot

        //.valueVar = .req(VariableDecl)
        this.valueVar = this.req(VariableDecl);

        //a comma means: previous var was 'nameIndex', so register previous as index and get value var

        //if .opt(',')
        if (this.opt(',')) {

            //.keyIndexVar = .valueVar
            this.keyIndexVar = this.valueVar;
            //.valueVar = .req(VariableDecl)
            this.valueVar = this.req(VariableDecl);
        };

        //another comma means: full 3 vars: for each intIndex,nameIndex,value in iterable.
        //Previous two where intIndex & nameIndex

        //if .opt(',')
        if (this.opt(',')) {

            //.intIndexVar = .keyIndexVar
            this.intIndexVar = this.keyIndexVar;
            //.keyIndexVar = .valueVar
            this.keyIndexVar = this.valueVar;
            //.valueVar = .req(VariableDecl)
            this.valueVar = this.req(VariableDecl);
        };

        //we now *require* `in` and the iterable: Object|Map|Array... any class having a iterableNext(iter) method

        //.req 'in'
        this.req('in');
        //.lock()
        this.lock();
        //.isMap = .opt('map')
        this.isMap = this.opt('map');
        //.iterable = .req(Expression)
        this.iterable = this.req(Expression);

        //optional where expression

        //.where = .opt(ForWhereFilter)
        this.where = this.opt(ForWhereFilter);

        //and then, loop body

        //.body = .req(Body)
        this.body = this.req(Body);
    }
}// end class ForEachInArray


//##Variant 3) **for index=...**
//### to do **numeric loops**

//This `for` variant is just a verbose expressions of the standard C (and js) `for(;;)` loop

//Grammar:
//`ForIndexNumeric: for index-VariableDecl [","] (while|until|to|down to) end-Expression ["," increment-SingleLineBody]`

//where `index-VariableDecl` is a numeric variable declared on the spot to store loop index,
//`start-Expression` is the start value for the index (ussually 0)
//`end-Expression` is:
//- the end value (`to`)
//- the condition to keep looping (`while`)
//- the condition to end looping (`until`)
//<br>and `increment-SingleLineBody` is the statement(s) used to advance the loop index.
//If omitted the default is `index++`

//    export class ForIndexNumeric extends ASTBase
// constructor
export class ForIndexNumeric extends ASTBase {
    keyIndexVar: VariableDecl
    conditionPrefix
    endExpression
    increment: Statement
    body
    // ---------------------------
    parse () {
        //.keyIndexVar = .req(VariableDecl)
        this.keyIndexVar = this.req(VariableDecl);
        //.lock()
        this.lock();

        //next comma is  optional, then
        //get 'while|until|to' and condition

        //.opt ','
        this.opt(',');
        //.conditionPrefix = .req('while','until','to','down')
        this.conditionPrefix = this.req('while', 'until', 'to', 'down');
        //if .conditionPrefix is 'down', .req 'to'
        if (this.conditionPrefix === 'down') { this.req('to') };
        //.endExpression = .req(Expression)
        this.endExpression = this.req(Expression);

        //another optional comma, and increment-Statement(s)
        if (this.opt(',')) {
            this.increment = this.req(Statement);
        };

        //Now, get the loop body
        this.body = this.req(Body);
    }
}// end class ForIndexNumeric



//    public helper class ForWhereFilter extends ASTBase
// constructor
export class ForWhereFilter extends ASTBase {
    filterExpression
    // ---------------------------
    parse () {
        //var optNewLine = .opt('NEWLINE')
        var optNewLine = this.opt('NEWLINE');

        //if .opt('where')
        if (this.opt('where')) {

            //.lock()
            this.lock();
            //.filterExpression = .req(Expression)
            this.filterExpression = this.req(Expression);
        }
        //if .opt('where')

        else {
            //if optNewLine, .lexer.returnToken # return NEWLINE
            if (optNewLine) { this.lexer.returnToken() };
            //.throwParseFailed "expected '[NEWLINE] where'"
            this.throwParseFailed("expected '[NEWLINE] where'");
        };
    }
}// end class ForWhereFilter

//--------------------------------

//    public class DeleteStatement extends ASTBase
// constructor
export class DeleteStatement extends ASTBase {
    varRef
    // ---------------------------
    parse () {
        //.req('delete')
        this.req('delete');
        //.lock()
        this.lock();
        //.varRef = .req(VariableRef)
        this.varRef = this.req(VariableRef);
    }
}// end class DeleteStatement
*/

/*
 * Partial AssignmentStatement
 * the L-Value has been parsed already
 * a '=' followed by an Expression 
 * */
export class AssignmentStatement extends ASTBase {
    lvalue: VarRef
    rvalue: Expression
    // ---------------------------
    parse() {
        this.name = this.reqToken(TokenCode.ASSIGNMENT)
        this.lock()
        this.rvalue = this.reqClass(Expression) as Expression
    }
    toString() {
        return Function.apply(ASTBase.toString, this) + ' = ' + this.rvalue.name
    }
    produce() {
        const o = this.owner.codeWriter
        this.lvalue.produce()
        o.write(' ' + this.name + ' ')
        this.rvalue.produce()
    }
}
// end class AssignmentStatement

//-----------------------
//## Accessors
//`Accessors: (PropertyAccess | FunctionAccess | IndexAccess)`

//Accessors:
//`PropertyAccess: '.' IDENTIFIER`
//`IndexAccess: '[' Expression ']'`
//`FunctionAccess: '('[Expression,] * ')'`

//Accessors can appear after a VariableRef (most common case)
//but also after a String constant, a Regex Constant,
//a ObjectLiteral and a ArrayLiteral

//Examples:
//- `myObj.item.fn(call)`  <-- 3 accesors, two PropertyAccess and a FunctionAccess
//- `myObj[5](param).part`  <-- 3 accesors, IndexAccess, FunctionAccess and PropertyAccess
//- `[1, 2, 3, 4].indexOf(3)` <-- 2 accesors, PropertyAccess and FunctionAccess


//#####Actions:

//`.` -> PropertyAccess: Search the property in the object and in his pototype chain.
//It resolves to the property value

//`[...]` -> IndexAccess: Same as PropertyAccess

//`(...)` -> FunctionAccess: The object is assumed to be a function, and the code executed.
//It resolves to the function return value.

//## Implementation
//We provide a class Accessor to be super class for the three accessors types.

export class Accessor extends ASTBase {

    static parseAccessors(node: VarRef) {

        let accessorFound=true
        //Loop parsing accessors
        while (accessorFound) {

            switch (node.owner.lexer.token.value) {

                case '.':  // . => property acceess
                    node.reqChild(PropertyAccess)
                    node.isFunctionCall = false
                    break

                case '(': // ( => function access
                    node.reqChild(FunctionAccess)
                    node.isFunctionCall = true //if the very last accesor is "(", it means the entire expression is a function call
                    node.hasSideEffects = true //if any accessor is a function call, this statement is assumed to have side-effects
                    break

                case '[': // [ => array access
                    node.reqChild(IndexAccess)
                    node.isFunctionCall = false
                    break

                default:
                    accessorFound=false
            }
        }
    }
}
// end class Accessor

export class FunctionAccess extends Accessor {
    // ---------------------------
    parse() {
        this.req('(')
        this.lock()
        this.children = this.optSeparatedList(FunctionArgument, ',', ')')
    }
    // ---------------------------
    toString() {
        return '(...)'
    }
    produce() {
        const o = this.owner.codeWriter
        //function accessor => function call
        o.write("(")
        this.produceChildren(", ")
        o.write(")")
    }
}
// end class FunctionAccess 

export class PropertyAccess extends Accessor {
    // ---------------------------
    parse() {
        this.req('.')
        this.lock()
        //check for NumberLiteral  x.0 rust tuple dot-index access. https://stackoverflow.com/questions/32030756/reasons-for-dot-notation-for-tuple
        if (this.owner.lexer.token.tokenCode == TokenCode.NUMBER) {
            this.keyword="tuple-index"
            this.extraInfo = this.owner.lexer.token.value
            this.owner.lexer.advance()
        }
        else {
            //let's assume .field access 
            this.name = this.reqToken(TokenCode.WORD)
        }
    }
    // ---------------------------
    toString() {
        return `.${this.name} `
    }
    produce() {
        const o = this.owner.codeWriter
        //function accessor => function call
        o.write(".")
        o.write(this.name)
    }
}
// end class PropertyAccess 

export class IndexAccess extends Accessor {
    // ---------------------------
    parse() {
        this.name = this.req('[')
        this.lock()
        this.reqChild(Expression)
        this.req(']')
    }// ---------------------------
    toString() {
        return '[...]'
    }
    produce() {
        const o = this.owner.codeWriter
        //function accessor => function call
        o.write("[")
        this.produceChildren()
        o.write("]")
    }
}
// end class IndexAccess

//-----------------------
/**
 * a VarRef can be:
 * 1. A "place" or L-Value, an Identifier with optional Accessors referencig a specific memory location with a type
 * 2. A Function call, returning a value (an R-value)
 * 
 * When used in Expressions, both interpretations are used as an R-Value, either by reading the value from the referenced place or executing the function call
 * 
 * The property `VarRref.isFunctionCall = true` marks it as a Function Call
 * 
 * A VarRef be an "Operand" of "InfixExpression"
 * 
 * Examples:
 *      myVar
 *      std::Rand(5)
 *      myData[7]
 *      myData[utils::getIndex(s)]
 *      myStruct.name
 *      myStruct.values[7].price
 *  
 * */
export class VarRef extends ASTBase {
    preIncDec
    postIncDec
    isFunctionCall: boolean
    hasSideEffects: boolean
    // ---------------------------
    parse() {

        this.preIncDec = this.optList(['--', '++'])
        this.isFunctionCall = false

        this.name = this.reqClass(Identifier).name
        this.lock()

        //Now we check for accessors:
        //<br>`.`->**PropertyAccess**
        //<br>`[...]`->**IndexAccess**
        //<br>`(...)`->**FunctionAccess**

        //Note: **.paserAccessors()** will:
        //- set .hasSideEffects=true if a function accessor is parsed
        //- set .isFunctionCall=true if the last accessor is a function accessor

        //.parseAccessors
        Accessor.parseAccessors(this)

        //.postIncDec = .opt('--','++')
        this.postIncDec = this.optList(['--', '++'])

        //If this variable ref has ++ or --, IT IS CONSIDERED a "call to execution" in itself,
        //a "imperative statement", because it has side effects.
        //(`i++` has a "imperative" part, It means: "give me the value of i, and then increment it!")

        if (this.preIncDec || this.postIncDec) {
            this.isFunctionCall = true
            this.hasSideEffects = true
        }
    }
    // ---------------------------
    toString() {
        //This method is only valid to be used in error reporting.
        //function accessors will be output as "(...)", and index accessors as [...]
        let result = `${this.preIncDec || ''}${this.name}`
        if (this.children) {
            for (const ac of this.children) {
                result = `${result}${ac.toString()} `
            }
        }
        return `${result}${this.postIncDec || ''}`
    }
}
// end class VariableRef




//## Operand

//```
//Operand: (
//(NumberLiteral|StringLiteral|RegExpLiteral|ArrayLiteral|ObjectLiteral
//|ParenExpression|FunctionDeclaration)[Accessors])
//|VariableRef)
//```

//Examples:
//<br> 4 + 3 -> `Operand Oper Operand`
//<br> -4    -> `UnaryOper Operand`

//A `Operand` is the data on which the operator operates.
//It's the left and right part of a binary operator.
//It's the data affected (righ) by a UnaryOper.

//To make parsing faster, associate a token type/value,
//with exact AST class to call parse() on.

//var OPERAND_DIRECT_TYPE = map

//'STRING': StringLiteral
//'NUMBER': NumberLiteral
//'REGEX': RegExpLiteral
//'SPACE_BRACKET':ArrayLiteral # one or more spaces + "["


/*
//    public class DefinePropertyItem extends ASTBase
// constructor
export class DefinePropertyItem extends ASTBase {
    negated: Boolean
    // ---------------------------
    parse () {
        //.lock()
        this.lock();
        //.negated = .opt('not')
        this.negated = this.opt('not');
        //.name = .req('enumerable','configurable','writable')
        //this.name = this.req('enumerable', 'configurable', 'writable');
    }
}// end class DefinePropertyItem

//## NamespaceDeclaration

//`NamespaceDeclaration: namespace IDENTIFIER Body`

//Declares a namespace.
//for js: creates a object with methods and properties
//for LiteC, just declare a namespace. All classes created inside will have the namespace prepended with "_"

//public class NamespaceDeclaration extends TraitDeclaration // NamespaceDeclaration is instance of TraitDeclaration
// constructor
export class NamespaceDeclaration extends TraitDeclaration {
    constructor() { // default constructor
        super(arguments)
    };
    // ---------------------------
    parse () {

        //.req 'namespace','Namespace'
        this.req('namespace', 'Namespace');

        //.lock()
        this.lock();
        //.name=.req('IDENTIFIER')
        this.name = this.req('IDENTIFIER');

        //Now get the namespace body

        //.body = .req(Body)
        this.body = this.req(Body);

        //.body.validate
        //PropertiesDeclaration
        //MethodDeclaration
        //TraitDeclaration
        //NamespaceDeclaration


        //## DebuggerStatement

        //`DebuggerStatement: debugger`

        //When a debugger is attached, break at this point.

        //public class DebuggerStatement extends ASTBase
        this.body.validate(PropertiesDeclaration, MethodDeclaration, TraitDeclaration, NamespaceDeclaration);
    }
}// end class NamespaceDeclaration


//## DebuggerStatement

//`DebuggerStatement: debugger`

//When a debugger is attached, break at this point.

//public class DebuggerStatement extends ASTBase
// constructor
export class DebuggerStatement extends ASTBase {
    constructor() { // default constructor
        super(arguments)
    };
    // ---------------------------
    parse () {
        //.name = .req("debugger")
        this.name = this.req('debugger');
    }
}// end class DebuggerStatement



//CompilerStatement
//-----------------

//`compiler` is a generic entry point to alter LiteScript compiler from source code.
//It allows conditional complilation, setting compiler options, and execute macros
//to generate code on the fly.
//Future: allow the programmer to hook transformations on the compiler process itself.
//<br>`CompilerStatement: (compiler|compile) (set|if|debugger|option) Body`
//<br>`set-CompilerStatement: compiler set (VariableDecl,)`
//<br>`conditional-CompilerStatement: 'compile if IDENTIFIER Body`

//public class CompilerStatement extends ASTBase
// constructor
export class CompilerStatement extends ASTBase {
    kind
    conditional: String
    list
    body
    endLineInx
    constructor() { // default constructor
        super(arguments)
        //properties
        //kind, conditional:string
        //list, body
        //endLineInx
    };
    // ---------------------------
    parse () {
        //.req 'compiler','compile'
        this.req('compiler', 'compile');
        //.lock()
        this.lock();

        //.kind = .req('set','if','debugger','options')
        this.kind = this.req('set', 'if', 'debugger', 'options');

        //### compiler set
        //get list of declared names, add to root node 'Compiler Vars'

        //if .kind is 'set'
        if (this.kind === 'set') {

            //.list = .reqSeparatedList(VariableDecl,',')
            this.list = this.reqSeparatedList(VariableDecl, ',');
        }
        //if .kind is 'set'

        else if (this.kind === 'debugger') {

            //debugger
            debugger;
        }
        //else if .kind is 'debugger' #debug-pause the compiler itself, to debug compiling process

        else {
            //.sayErr 'invalid compiler command'
            this.sayErr('invalid compiler command');
        };
    }
}// end class CompilerStatement


//## Import Statement

//`ImportStatement: import (ImportStatementItem,)`

//Example: `import fs, path` ->  js:`var fs=require('fs'),path=require('path')`

//Example: `import Args, wait from 'wait.for'` ->  js:`var http=require('./Args'),wait=require('./wait.for.js')`

//public class ImportStatement extends ASTBase
// constructor
export class ImportStatement extends ASTBase {
    global: Boolean
    list: []
    // ---------------------------
    parse () {
        //.req('import')
        this.req('import');
        //.lock
        this.lock();

        //if .lexer.options.browser, .throwError "'import' statement invalid in browser-mode. Do you mean 'global declare'?"
        if (this.lexer.options.browser) { this.throwError("'import ' statement invalid in browser-mode. Do you mean 'global declare'?") };

        //.list = .reqSeparatedList(ImportStatementItem,",")
        this.list = this.reqSeparatedList(ImportStatementItem, ',');

        //keep track of `import/require` calls

        //var parentModule = .getParent(Module)
        var parentModule = this.getParent(Module);
        //for each item in .list
        for (const item of this.list) {
            //parentModule.requireCallNodes.push item
            parentModule.requireCallNodes.push(item);
        };// end for each in this.list

    }
}// end class ImportStatement


//    export class ImportStatementItem extends ASTBase
// constructor
export class ImportStatementItem extends ASTBase {
    importParameter: StringLiteral
    constructor() { // default constructor
        super(arguments)
        //properties
        //importParameter:StringLiteral
    };
    // ---------------------------
    parse () {
        //.name = .req('IDENTIFIER')
        this.name = this.req('IDENTIFIER');
        //if .opt('from')
        if (this.opt('from')) {

            //.lock()
            this.lock();
            //.importParameter = .req(StringLiteral)
            this.importParameter = this.req(StringLiteral);
        };
        //end if

        //## DeclareStatement

        //Declare allows you to define a variable and/or its type
        //*for the type-checker (at compile-time)*

        //#####Declare variable:type
        //`DeclareStatement: declare VariableRef:type-VariableRef`

        //Declare a variable type on the fly, from declaration point onward

        //Example: `declare name:string, parent:Grammar.Statement` #on the fly, from declaration point onward


        //#####Global Declare
        //`global declare (ImportStatementItem+)`
        //Browser-mode: Import a *.interface.md* file to declare a global pre-existent complex objects
        //Example: `global declare jQuery,Document,Window`

        //#####Declare [global] var
        //`DeclareStatement: declare [global] var (VariableDecl,)+`

        //Allows you to declare a preexistent [global] variable
        //Example: `declare global var window:object`

        //#####Declare global type for VariableRef

        //Allows you to set the type on a existing variable
        //globally for the entire compilation.

        //Example:
        //`declare global type for LocalData.user: Models.userData` #set type globally for the entire compilation


        //#####Declare name affinity
        //`DeclareStatement: name affinity (IDENTIFIER,)+`

        //To be used inside a class declaration, declare var names
        //that will default to Class as type

        //Example
        //```
        //Class VariableDecl
        //properties
        //name: string, sourceLine, column
        //declare name affinity varDecl
        //```

        //Given the above declaration, any `var` named (or ending in) **"varDecl"** or **"VariableDecl"**
        //will assume `:VariableDecl` as type. (Class name is automatically included in 'name affinity')

        //Example:
        //`var varDecl, parentVariableDecl, childVarDecl, variableDecl`

        //all three vars will assume `:VariableDecl` as type.

        //#####Declare valid
        //`DeclareStatement: declare valid IDENTIFIER("."(IDENTIFIER|"()"|"[]"))* [:type-VariableRef]`

        //To declare, on the fly, known-valid property chains for local variables.
        //Example:
        //`declare valid data.user.name`
        //`declare valid node.parent.parent.text:string`
        //`declare valid node.parent.items[].name:string`

        //#####Declare on
        //`DeclareStatement: declare on IDENTIFIER (VariableDecl,)+`

        //To declare valid members on scope vars.
        //Allows you to declare the valid properties for a local variable or parameter
        //Example:
        //
        //    function startServer(options)
        //        declare on options
        //            name:string, useHeaders:boolean, port:number


        //    export class DeclareStatement extends ASTBase

    }
}// end class ImportStatementItem

//## DeclareStatement

//Declare allows you to define a variable and/or its type
//*for the type-checker (at compile-time)*

//#####Declare variable:type
//`DeclareStatement: declare VariableRef:type-VariableRef`

//Declare a variable type on the fly, from declaration point onward

//Example: `declare name:string, parent:Grammar.Statement` #on the fly, from declaration point onward


//#####Global Declare
//`global declare (ImportStatementItem+)`
//Browser-mode: Import a *.interface.md* file to declare a global pre-existent complex objects
//Example: `global declare jQuery,Document,Window`

//#####Declare [global] var
//`DeclareStatement: declare [global] var (VariableDecl,)+`

//Allows you to declare a preexistent [global] variable
//Example: `declare global var window:object`

//#####Declare global type for VariableRef

//Allows you to set the type on a existing variable
//globally for the entire compilation.

//Example:
//`declare global type for LocalData.user: Models.userData` #set type globally for the entire compilation


//#####Declare name affinity
//`DeclareStatement: name affinity (IDENTIFIER,)+`

//To be used inside a class declaration, declare var names
//that will default to Class as type

//Example
//```
//Class VariableDecl
//properties
//name: string, sourceLine, column
//declare name affinity varDecl
//```

//Given the above declaration, any `var` named (or ending in) **"varDecl"** or **"VariableDecl"**
//will assume `:VariableDecl` as type. (Class name is automatically included in 'name affinity')

//Example:
//`var varDecl, parentVariableDecl, childVarDecl, variableDecl`

//all three vars will assume `:VariableDecl` as type.

//#####Declare valid
//`DeclareStatement: declare valid IDENTIFIER("."(IDENTIFIER|"()"|"[]"))* [:type-VariableRef]`

//To declare, on the fly, known-valid property chains for local variables.
//Example:
//`declare valid data.user.name`
//`declare valid node.parent.parent.text:string`
//`declare valid node.parent.items[].name:string`

//#####Declare on
//`DeclareStatement: declare on IDENTIFIER (VariableDecl,)+`

//To declare valid members on scope vars.
//Allows you to declare the valid properties for a local variable or parameter
//Example:
//
//    function startServer(options)
//        declare on options
//            name:string, useHeaders:boolean, port:number



//FunctionCall
//------------
//`FunctionCall: VariableRef ["("] (FunctionArgument,) [")"]`

export class FunctionCall extends ASTBase {
    varRef: VariableRef
    // ---------------------------
    parse () {

        //Check for VariableRef. - can include (...) FunctionAccess
        this.varRef = this.reqClass(VariableRef);

        //if the last accessor is function call, this is already a FunctionCall
        //debug "#{.varRef.toString()} #{.varRef.executes?'executes':'DO NOT executes'}"

        //if .varRef.executes
        if (this.varRef.executes) {
            //already a function call
            return;
        };

        if (this.owner.tokenizer.token.type === TokenCode.EOF) {
            // no more tokens
            return;
        };

        // get parameters, add to varRef as FunctionAccess accessor,

        var functionAccess = new FunctionAccess(this.varRef,'');
        functionAccess.args = functionAccess.reqSeparatedList(FunctionArgument, ',',')');
        //.varRef.addAccessor functionAccess
        this.varRef.addAccessor(functionAccess);
    }
}// end class FunctionCall


//## CaseStatement

//`CaseStatement: case [VariableRef] [instance of] NEWLINE (when (Expression,) Body)* [else Body]`

//Similar syntax to ANSI-SQL 'CASE', and ruby's 'case'
//but it is a "statement" not a expression

//Examples:
//
//
//    case b
//      when 2,4,6:
//        print 'even'
//      when 1,3,5:
//        print 'odd'
//      else
//        print 'idk'
//    end
//
//    // case instance of
//    case b instance of
//
//      when VarStatement:
//        print 'variables #{b.list}'
//
//      when AppendToDeclaration:
//        print 'it is append to #{b.varRef}'
//
//      when NamespaceDeclaration:
//        print 'namespace #{b.name}'
//
//      when TraitDeclaration:
//        print 'a class, extends #{b.varRefSuper}'
//
//      else
//        print 'unexpected class'
//
//    end
//
//    // case when TRUE
//    var result
//    case
//        when a is 3 or b < 10:
//            result = 'option 1'
//        when b >= 10 or a<0 or c is 5:
//            result= 'option 2'
//        else
//            result = 'other'
//    end
//

//    public class CaseStatement extends ASTBase
// constructor
export class CaseStatement extends ASTBase {
    varRef: VariableRef
    isInstanceof: Boolean
    cases: Array
    elseBody: Body
    constructor() { // default constructor
        super(arguments)
        //properties
        //varRef: VariableRef
        //isInstanceof: boolean
        //cases: array of WhenSection
        //elseBody: Body
    };
    // ---------------------------
    parse () {

        //.req 'case'
        this.req('case');
        //.lock
        this.lock();

        //.varRef = .opt(VariableRef)
        this.varRef = this.opt(VariableRef);

        //.isInstanceof = .opt('instance','instanceof') //case foo instance of
        this.isInstanceof = this.opt('instance', 'instanceof');
        //if .isInstanceof is 'instance', .opt('of')
        if (this.isInstanceof === 'instance') { this.opt('of') };

        //.req('NEWLINE')
        this.req('NEWLINE');

        //.cases=[]
        this.cases = [];
        //while .opt(WhenSection) into var whenSection
        var whenSection:= undefined
        while ((whenSection = this.opt(WhenSection))) {
            //.cases.push whenSection
            this.cases.push(whenSection);
        };// end loop

        //if .cases.length is 0, .sayErr 'no "when" sections found for "case" construction'
        if (this.cases.length === 0) { this.sayErr('no "when" sections found for "case" construction') };

        //if .opt('else')
        if (this.opt('else')) {

            //.elseBody = .req(Body)
            this.elseBody = this.req(Body);
        };
    }
}// end class CaseStatement

//    public helper class WhenSection extends ASTBase
// constructor
export class WhenSection extends ASTBase {
    expressions: Array
    body
    constructor() { // default constructor
        super(arguments)
        //properties
        //expressions: Expression array
        //body
    };
    // ---------------------------
    parse () {

        //.req 'when'
        this.req('when');
        //.lock
        this.lock();
        //.expressions = .reqSeparatedList(Expression, ",",":")
        this.expressions = this.reqSeparatedList(Expression, ',', ':');

        //if .lexer.token.type is 'NEWLINE'
        if (this.owner.tokenizer.token.type === 'NEWLINE') {

            //.body = .req(Body) //indented body block
            this.body = this.req(Body);
        }
        //if .lexer.token.type is 'NEWLINE'

        else {
            //.body = .req(SingleLineBody)
            this.body = this.req(SingleLineBody);
        };
    }
}// end class WhenSection



//#### Module level var: valid combinations adjective-statement

//var validCombinations = map
//export: ['class','namespace','function','var']
//only: ['class','namespace']
//generator: ['function','method']
//nice: ['function','method']
//shim: ['function','method','import']
//helper:  ['function','method','class','namespace']
//global: ['declare','class','namespace','function','var']


//    append to class ASTBase
var validCombinations = new Map().fromObject({
    export: ['class', 'namespace', 'function', 'var']
    , only: ['class', 'namespace']
    , generator: ['function', 'method']
    , nice: ['function', 'method']
    , shim: ['function', 'method', 'import']
    , helper: ['function', 'method', 'class', 'namespace']
    , global: ['declare', 'class', 'namespace', 'function', 'var']
});


//    append to class ASTBase


//      helper method hasAdjective(names:string) returns boolean
// ---------------------------
hasAdjective = function (names) {
    //To check if a statement has one or more adjectives.
    //We assume .parent is Grammar.Statement

    //var stat:Statement = this.constructor is Statement? this else .getParent(Statement)
    var stat = this.constructor === Statement ? this : this.getParent(Statement);
    //if no stat, .throwError "[#{.constructor.name}].hasAdjective('#{names}'): can't find a parent Statement"
    if (!stat) { this.throwError(`[${.constructor.name}].hasAdjective('#{names}'): can't find a parent Statement`) };

    //var allToSearch = names.split(" ")
    var allToSearch = names.split(' ');
    //for each name in allToSearch
    for (const name of allToSearch) {
        //if no name in stat.adjectives, return false
        if (!(stat.adjectives.indexOf(name) >= 0)) { return false };
    };// end for each in allToSearch

    //return true //if all requested are adjectives
    return true;
};

//## Trait bodt
//Trait bodt is a semicolon-separated list of {fn}s 
export class TraitBody extends ASTBase {
    fnDecls: FunctionDeclaration[]
    // ---------------------------
    parse() {
        this.fnDecls = this.reqSeparatedList(FunctionDeclaration, ';', '}') as FunctionDeclaration[]
    }
}

*/

// ------------------------
/*
 * export class TypeDeclaration extends ASTBase {
    mainType
    keyType
    itemType
    // ---------------------------
    parse() {

        //parse type declaration:

        //function [(VariableDecl,)]
        //type-IDENTIFIER [array]
        //[array of] type-IDENTIFIER
        //map type-IDENTIFIER to type-IDENTIFIER

        //if .opt('function','Function') #function as type
        if (this.opt('function', 'Function')) {

            //.lock
            this.lock();
            //.mainType= new VariableRef(this, 'Function')
            this.mainType = new VariableRef(this, 'Function');
            //if .lexer.token.value is '(', .parseAccessors
            if (this.owner.tokenizer.token.value === '(') { this.parseAccessors() };
            //return
            return;
        };

        //check for 'array', e.g.: `var list : array of String`

        //if .opt('array','Array')
        if (this.opt('array', 'Array')) {

            //.lock
            this.lock();
            //.mainType = 'Array'
            this.mainType = 'Array';
            //if .opt('of')
            if (this.opt('of')) {

                //.itemType = .req(VariableRef) #reference to an existing class
                this.itemType = this.req(VariableRef);
                //auto-capitalize core classes
                //declare .itemType:VariableRef

                //.itemType.name = autoCapitalizeCoreClasses(.itemType.name)
                this.itemType.name = autoCapitalizeCoreClasses(this.itemType.name);
            };
            //end if
            //return

            //return
            return;
        };

        //Check for 'map', e.g.: `var list : map string to Statement`

        //.mainType = .req(VariableRef) #reference to an existing class
        this.mainType = this.req(VariableRef);
        //.lock
        this.lock();
        //auto-capitalize core classes
        //declare .mainType:VariableRef

        //.mainType.name = autoCapitalizeCoreClasses(.mainType.name)
        this.mainType.name = autoCapitalizeCoreClasses(this.mainType.name);

        //if .mainType.name is 'Map'
        if (this.mainType.name === 'Map') {

            //.parent.isMap = true
            this.parent.isMap = true;
            //.extraInfo = 'map [type] to [type]' //extra info to show on parse fail
            this.extraInfo = 'map [type] to [type]';
            //.keyType = .req(VariableRef) #type for KEYS: reference to an existing class
            this.keyType = this.req(VariableRef);
            //auto-capitalize core classes
            //declare .keyType:VariableRef

            //.keyType.name = autoCapitalizeCoreClasses(.keyType.name)
            this.keyType.name = autoCapitalizeCoreClasses(this.keyType.name);
            //.req('to')
            this.req('to');
            //.itemType = .req(VariableRef) #type for values: reference to an existing class
            this.itemType = this.req(VariableRef);
            //#auto-capitalize core classes
            //declare .itemType:VariableRef

            //.itemType.name = autoCapitalizeCoreClasses(.itemType.name)
            this.itemType.name = autoCapitalizeCoreClasses(this.itemType.name);
        }
        //if .mainType.name is 'Map'

        else {
            //#check for 'type array', e.g.: `var list : string array`
            //if .opt('Array','array')
            if (this.opt('Array', 'array')) {

                //.itemType = .mainType #assign read mainType as sub-mainType
                this.itemType = this.mainType;
                //.mainType = 'Array' #real type
                this.mainType = 'Array';
            };
        };
    }// ---------------------------
    toString () {
        //return .mainType
        return this.mainType;
    }
}// end class TypeDeclaration
*/

//##Statement

//A `Statement` is an imperative statment (command) or a control construct.

//The `Statement` node is a generic container for all previously defined statements.


//The generic `Statement` is used to define `Body: (Statement;)`, that is,
//**Body** is a list of semicolon (or NEWLINE) separated **Statements**.

//Grammar:
//```
//Statement: [Adjective]* (TraitDeclaration|FunctionDeclaration
//|IfStatement|ForStatement|WhileUntilLoop|DoLoop
//|AssignmentStatement
//|LoopControlStatement|ThrowStatement
//|TryCatch|ExceptionBlock
//|ReturnStatement|PrintStatement|DoNothingStatement)

//Statement: ( AssignmentStatement | fnCall-VariableRef [ ["("] (Expression,) [")"] ] )
//```

//public class Statement extends ASTBase
// constructor
export class Statement {

    //----------------------------------------
    //Table-based (fast) Statement parsing
    //------------------------------------
    //This a extension to PEGs.
    //To make the compiler faster and easier to debug, we define an
    //object with name-value pairs: `"keyword" : AST node class`
    //We look here for fast-statement parsing, selecting the right AST node to call `parse()` on
    //based on `token.value`. (instead of parsing by ordered trial & error)
    //This table makes a direct parsing of almost all statements, thanks to a core definition of LiteScript:
    //Anything standing alone in it's own line, its an imperative statement (it does something, it produces effects).
    static DirectKeywordMap: Record<string, typeof ASTBase> = {
        'use': UseDeclaration
        , 'mod': ModDeclaration
        , 'const': ConstDeclaration
        , 'static': StaticDeclaration
        , 'trait': TraitDeclaration
        , 'type': TypeDeclaration
        , '#': LineAttribute
        , 'struct': StructDeclaration
        , 'impl': ImplDeclaration
        , 'fn': FunctionDeclaration
        , 'let': LetStatement
        , 'if': IfStatement
        , 'while': WhileStatement
        , 'for': ForStatement
        , 'match': MatchExpression
        //, 'break': LoopControlStatement
        //, 'continue': LoopControlStatement
        , 'return': ReturnStatement
        , 'throw': ThrowStatement
        , 'raise': ThrowStatement
        , 'try': TryCatch
    }

    // ---------------------------
    /** static Statement.tryParse
     *  try to parse a statement and return the specific node found | throws
     * @param node
     */
    static tryParse(node: ASTBase): ASTBase {

        node.lock() //no other option than a statement

        //manage rust attributes (lines starting with #)
        if (node.owner.lexer.token.tokenCode == TokenCode.ATTRIBUTE) {
            return node.reqClass(LineAttribute)
        }

        //manage special keywords like 'pub'
        const isPublic = (node.opt('pub') == 'pub')

        const key = node.owner.lexer.token.value

        const resultASTNode = Statement.tryParseByKeyword(node, key)

        resultASTNode.keyword = key
        resultASTNode.isPublic = isPublic
        Expression.checkNativeRustConversionMapCollect(resultASTNode) //veo si tiene una llamada a .to_vec() u otra conversi�n

        return resultASTNode

    }

    private static tryParseByKeyword(node: ASTBase, key: string): ASTBase {

        //manage rust macros
        if (node.owner.lexer.nextToken().value == '!') { //it's a macro!
            return node.reqClass(MacroInvocation)
        }

        //rust expression as as statement, discarded or returned if it is the last expression in the function
        if (key == '(') { //it's a (Expression-maybeReturn-Statement)
            return node.reqClass(ParenExpression)
        }

        //Now we can look up the keyword in the **StatementsDirect** table, and parse the specific AST node
        const ClassByKeyword = Statement.DirectKeywordMap[key]
        if (ClassByKeyword) {
            //keyword found, use the AST class to parse
            return node.reqClass(ClassByKeyword)
        }

        //if keyword not found in table
        //let's asume it's a fn call or an assignment statement
        // lets try then to parse a varRef, that could result in a fn-call or in an L-Value for an assignment
        const vr: VarRef = node.reqClass(VarRef) as VarRef
        if (vr.isFunctionCall) {//it was a fn call
            return vr
        }

        //let's see if node is a struct instantiation expression
        //rust's struct instantiation have the form: IDENT ObjectLiteral 
        //ObjectLiteral  = '{' [ NameValuePair, ] '}'
        if (node.owner.lexer.token.value == "{") { //let's assume is a Struct Instantiation
            //it's a Struct Instantiation
            const objectLiteral = node.reqClass(ObjectLiteral)
            objectLiteral.name = vr.name
            objectLiteral.keyword = "struct-instantiation"
            return objectLiteral 
        }

        //it wasn't a function call,
        //if there's an assignmen token => AssignmentStatement
        //else is just an expression-maybe-return-value
        if (node.owner.lexer.token.tokenCode == TokenCode.ASSIGNMENT) {
            //it's is an AssignmentStatement
            const assignmentStatement = node.reqClass(AssignmentStatement) as AssignmentStatement
            assignmentStatement.lvalue = vr //complete the AssignmentStatement L-value with the prevously parsed VarRef
            return assignmentStatement
        }

        //finally, just a expression
        //the preParsedVarRef is just a R-Value, an expression-maybe-return-value
        return vr
    }
}
// end class Statement

//## Body
// a Body is a (optional)semicolon-separated list of statements (At least one) ending with a "closer", either '}' or EOF
//Body is used for "fn" body, for body, if& else bodies, etc.
// Anywhere a list of semicolon separated statements apply.
/**
 * '{' [Statements;] '}'
 * */
export class Body extends ASTBase {
    parse() {
        this.req("{")
        this.lock()
        Body.parseIntoChildren(this)
    }
    // ---------------------------
    produce() {
        this.produceBody(4)
    }
    // ---------------------------
    static reqAsChild(parent: ASTBase, name: string = "Body"): void {
        const newBlock = parent.reqClass(Body)
        newBlock.name = name
        parent.children.push(newBlock)
    }
    // ---------------------------
    static optIntoChildren(node: ASTBase, closer: string = "}") {
        if (node.opt("{")) {
            Body.parseIntoChildren(node, closer)
        }
    }
    // ---------------------------
    static parseIntoChildren(node: ASTBase, closer: string = "}") {
        node.lock()
        //We accept statements and comments as items in the body
        //A Body is a list of Statements|LineComments separated by *semicolon* and, closed by "}"
        const separator = ';'
        logger.debug(`Body for ${node.constructor.name}: get LineComments & Statements separated by '${separator}' closer:`, closer || ' to EOF')

        while (true) {

            node.owner.lexer.skipWhiteSpaceAndNewLine()

            //pre comments and attrs
            const preComments: string[] = []
            node.owner.lexer.consumeCommentsAndAttr(preComments)

            if (node.owner.lexer.token.tokenCode == TokenCode.EOF) break //break on EOF
            if (closer && node.opt(closer)) break //on closer:'}', break - end of body, (a single extra separator before closer is allowed)

            //-----------------------
            //here we assume it's a Statement
            //Statement.tryParse will return the right AST class parsed
            const statement = Statement.tryParse(node)
            //attach pre-comments to the statement
            statement.commentsAndAttr = preComments
            //keep a dict of declaredStructs in order to be able to recognize struct instantiation 
            //(there's no keyword in a struct instantiation, just the struct's name | Self)
            if (statement instanceof StructDeclaration) {
                node.owner.declaredStructs[statement.name] = statement
            }
            //add post comments and attr - NO, se come precomments del sieguiente after a struct { }
            //node.owner.tokenizer.consumeCommentsAndAttr(item.commentsAndAttr)

            node.children.push(statement)

            if (node.opt(closer)) break //if closer '}' found here, break - end of body

            //special case: check if now comes a separator (;) followed of a comment on the same line...
            statement.attachedComment = node.owner.lexer.getAttachedCommentAfter(separator)
            if (statement.attachedComment) {
                //keep the comments atttached to the statement
                continue //Next sentence, separator found and consumed
            }

            //if the statement had a body defined by { }, or the statemente consumend the separator ";" -- it's OK
            if (node.owner.lexer.token.value != separator) {
                //allow exceptions, separator is not required
                continue
            }

            //if there is a 'separator' (semicolon), let's consume it
            node.owner.lexer.semiNotRequired = false
            node.req(separator)

        }// try another item after the separator

        if (closer == '}') node.owner.lexer.semiNotRequired = true // no need for a semicolon if closed by '}'
    }
}
// end class Body

//## Module
//The `Module` represents a complete source file.
export class ASTModule extends ASTBase {
    dependencyTreeLevel = 0
    dependencyTreeLevelOrder = 0
    importOrder = 0
    //------------
    constructor(owner: Parser, filename: string) {
        super(null, filename)
        this.owner = owner
    }
    parse() {
        const closer = undefined //parse until EOF
        Body.parseIntoChildren(this, closer)
    }

}
