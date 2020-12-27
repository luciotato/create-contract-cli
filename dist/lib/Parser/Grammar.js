"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * This Grammar is based on [Parsing Expression Grammars (PEGs)](http://en.wikipedia.org/wiki/Parsing_expression_grammar)
 * *with extensions*.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTModule = exports.Body = exports.Statement = exports.VarRef = exports.IndexAccess = exports.PropertyAccess = exports.FunctionAccess = exports.Accessor = exports.ForStatement = exports.RangeExpression = exports.WhileStatement = exports.IfStatement = exports.ReturnStatement = exports.TraitDeclaration = exports.FunctionParameters = exports.LetStatement = exports.VariableDecl = exports.FunctionDeclaration = exports.MatchExpression = exports.MatchPair = exports.RustClosure = exports.IdentifierMaybeTuple = exports.LineAttribute = exports.ImplDeclaration = exports.EnumDeclaration = exports.EnumItem = exports.StructDeclaration = exports.MacroInvocation = exports.DelimitedWordList = exports.TypeDeclaration = exports.ModDeclaration = exports.UseDeclaration = exports.TypeAnnotation = exports.ParenExpression = exports.ConstDeclaration = exports.ArrayLiteral = exports.StaticDeclaration = exports.ObjectLiteral = exports.NameValuePair = exports.RustNativeSuffixes = exports.Expression = exports.FunctionArgument = exports.Operand = exports.RegExpLiteral = exports.StringLiteral = exports.NumberLiteral = exports.UnaryOper = exports.Oper = exports.Identifier = void 0;
// Grammar Meta-Syntax
// -------------------
// Each Grammar class, contains a 'grammar definition' as reference.
// The meta-syntax for the grammar definitions is an extended form of
// [Parsing Expression Grammars (PEGs)](http://en.wikipedia.org/wiki/Parsing_expression_grammar)
// The differences with classic PEG are:
//* instead of `Symbol <- definition`, we use `Symbol: definition` (colon instead of arrow)
//* we use `[Symbol]` for optional symbols instead of `Symbol?` (brackets also groups symbols, the entire group is optional)
//* symbols upper/lower case has meaning
//* we add `(Symbol,)` for `comma separated List of` as a powerful syntax option
// Meta-Syntax Examples:
// `function`     : all-lowercase means the literal word: "function"<br>
// `":"`              : literal symbols are quoted<br>
// `ReturnStatement`  : CamelCase is reserved for composed, non-terminal symbol<br>
// `IDENTIFIER`,`OPER` : all-uppercase denotes a entire class of symbols<br>
// `NEWLINE`,`EOF`     : or special unprintable characters<br>
// `[to]`               : Optional symbols are enclosed in brackets<br>
// `(var|let)`          : The vertical bar represents ordered alternatives<br>
// `(Oper Operand)`     : Parentheses groups symbols<br>
// `(Oper Operand)*`    : Asterisk after a group `()*` means the group can repeat (meaning one or more)<br>
// `[Oper Operand]*`    : Asterisk after a optional group `[]*` means *zero* or more of the group.<br>
// `[Expression,]` : means: "optional comma separated list of Expressions".<br>
// `Body: (Statement;)` : means "Body is a semicolon-separated list of statements".<br>
// Full Meta-Syntax Example:
// `PrintStatement: print [Expression,]`
// It reads: composed symbol `PrintStatement` is conformed by the word `print` followed by
// an _optional_ comma-separated list of `Expression`
// ###More on comma-separated lists
// Let's analyze the example: `PrintStatement: print [Expression,]`
// `[Expression,]` means *optional* **comma "Separated List"** of Expressions.
// Since the comma is inside a **[ ]** group, it means the entire list is optional.
// Another example:
// `VariableDecl: IDENTIFIER ["=" Expression]`
// `VarStatement: var (VariableDecl,)`
// It reads: composed symbol `VarStatement` is conformed by the word `var` followed by
// a comma-separated list of `VariableDecl` (at least one)
// The construction `(VariableDecl,)` means: **comma "Separated List"** of `VariableDecl`
// Since the comma is inside a **( )** group, it means _at least one VariableDecl_ is required.
const ASTBase_1 = require("./ASTBase");
const logger = require("../util/logger.js");
const Lexer_1 = require("../Lexer/Lexer");
const os_1 = require("os");
// Reserved Words
// ---------------
// Words that are reserved and cannot be used as variable or function names
const RESERVED_WORDS = ['fn', 'async', 'class', 'if', 'then', 'else', 'null', 'true', 'false',
    'new', 'loop', 'while', 'crate', 'for', 'to', 'break', 'continue',
    'return', 'try', 'catch', 'throw', 'raise', 'fail', 'exception', 'finally',
    'mut', 'var', 'let',
    'yield', 'await', 'self', 'super', 'export',
    'async', 'short', 'long', 'int',
    'unsigned', 'void', 'null', 'bool', 'assert'];
// Operators precedence
// --------------------
// The order of symbols here determines operators precedence
// var operatorsPrecedence = [
// '++','--', 'unary -', 'unary +', 'bitnot' ,'bitand', 'bitor', 'bitxor'
//, '>>','<<'
//, 'new','type of','instance of','has property'
//, '*','/','%','+','-','&'
//, 'into','in'
//, '>','<','>=','<=','is','<>','!==','like'
//, 'no','not','and','but','or'
//, '?',':'
// ]
const OPERATORS_PRECEDENCE = ['&', '&mut', '*',
    '!', '?',
    'unary -', 'unary +',
    'as',
    '*', '/', '%', '&', '|', '^', '>>', '<<',
    '+', '-',
    '==', '!=', '>', '<', '>=', '<=',
    '||', '&&',
    '..', '..=',
    '=', '+=', '-=', '*=', '/='
];
// --------------------------
// Grammar - AST Classes
//= ===============================
// You'll find a class for each syntax construction the parser accepts
/**
 * can include namespace::namespace::name
 * */
class Identifier extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.optMut();
        this.optRef();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        while (this.opt('::')) {
            this.name += '::';
            if (this.opt("<")) {
                this.typeParams = DelimitedWordList.parseOpened(this, '<', '>');
            }
            else {
                this.name += this.reqToken(Lexer_1.TokenCode.WORD);
            }
        }
    }
}
exports.Identifier = Identifier;
// ## Oper
// ```
// Oper: ('~'|'&'|'^'|'|'|'>>'|'<<'
// |'*'|'/'|'+'|'-'|mod
// |'>'|'<'|'>='|'<='
// etc.
// ```
// An Oper sits between two Operands ("Oper" is a "Binary Operator",
// different from *UnaryOperators* which optionally precede a Operand)
// If an Oper is found after an Operand, a second Operand is expected.
class Oper extends ASTBase_1.ASTBase {
    constructor() {
        super(...arguments);
        // ---------------------------
        this.getPrecedence = function () {
            this.precedence = OPERATORS_PRECEDENCE.indexOf(this.name);
            if (this.precedence === -1) {
                this.sayErr(`OPER '${this.name}' not found in the operator precedence list`);
            }
        };
    }
    // ---------------------------
    parse() {
        if (this.owner.lexer.token.value == "as") { // typecast operation
            this.lock();
            this.name = this.req("as");
        }
        else {
            this.name = this.reqToken(Lexer_1.TokenCode.OPERATOR);
            this.lock();
            // check range operator
            if (this.name == ".." && this.opt("=")) {
                this.name = "..=";
            }
        }
        // Get operator precedence index
        this.getPrecedence();
    }
    // ----------------
    produce() {
        var _a, _b;
        (_a = this.left) === null || _a === void 0 ? void 0 : _a.produce();
        this.owner.codeWriter.write(' ' + this.name + ' ');
        (_b = this.right) === null || _b === void 0 ? void 0 : _b.produce();
    }
}
exports.Oper = Oper;
// end class Oper
class UnaryOper extends Oper {
    // ---------------------------
    parse() {
        this.name = this.reqOneOf(['+', '-', '!']);
        // Lock, we have a unary oper
        this.lock();
        // Rename - and + to 'unary -' and 'unary +',
        // if .name is '-'
        if (this.name == '-' || this.name == '+') {
            this.precedence = 0;
        }
        else {
            // calculate precedence - Oper.getPrecedence()
            this.getPrecedence();
        }
    }
}
exports.UnaryOper = UnaryOper;
// end class UnaryOper
// ## NumberLiteral
// `NumberLiteral: [0-9_.u] | '0x[0-9a-fA-F] | 0b[0-1][u0-9] `
class NumberLiteral extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.tokenCode = this.owner.lexer.token.tokenCode;
        this.name = this.reqList([Lexer_1.TokenCode.NUMBER, Lexer_1.TokenCode.HEXANUMBER, Lexer_1.TokenCode.BINARYNUMBER]);
        Expression.checkNativeRustConversionMapCollect(this); // veo si tiene una llamada a .to_vec() u otra conversi�n
    }
}
exports.NumberLiteral = NumberLiteral;
// end class NumberLiteral
// ## StringLiteral
// `StringLiteral: '"' [ any* | '\"' ] '"' | ''' [ any* | '\'' ] '''
// A string constant token. Can be anything the lexer supports, including single or double-quoted strings.
// The token includes the enclosing quotes
class StringLiteral extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.name = this.reqToken(Lexer_1.TokenCode.LITERAL_STRING);
        Expression.checkNativeRustConversionMapCollect(this); // veo si tiene una llamada a .to_vec() u otra conversi�n
    }
    // ---------------------------
    unquoted() {
        return this.name.slice(1, -1);
    }
}
exports.StringLiteral = StringLiteral;
// end class StringLiteral
// ## RegExpLiteral
// `RegExpLiteral: REGEX`
// A regular expression token constant. Can be anything the lexer supports.
class RegExpLiteral extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.name = this.reqToken(Lexer_1.TokenCode.LITERAL_STRING);
        Expression.checkNativeRustConversionMapCollect(this); // veo si tiene una llamada a .to_vec() u otra conversi�n
    }
}
exports.RegExpLiteral = RegExpLiteral;
// end class RegExpLiteral
// ## Operand
// ```
// Operand: (
// (NumberLiteral|StringLiteral|RegExpLiteral|ArrayLiteral|ObjectLiteral
// |ParenExpression|FunctionDeclaration)[Accessors])
// |VariableRef)
// ```
// Examples:
// <br> 4 + 3 -> `Operand Oper Operand`
// <br> -4    -> `UnaryOper Operand`
// A `Operand` is the data on which the operator operates.
// It's the left and right part of a binary operator.
// It's the data affected (righ) by a UnaryOper.
class Operand extends ASTBase_1.ASTBase {
    // -------------------------
    // value is at children[0]
    // -------------------------
    parse() {
        // Let's look for operands in a expression, i.e: "a" and "b" in  "a+b*5"
        const t = this.owner.lexer.token;
        if ([Lexer_1.TokenCode.NUMBER, Lexer_1.TokenCode.HEXANUMBER, Lexer_1.TokenCode.BINARYNUMBER].includes(t.tokenCode)) {
            this.children.push(this.reqClass(NumberLiteral));
            return; //* *** early exit
        }
        if (t.tokenCode == Lexer_1.TokenCode.LITERAL_STRING) {
            this.children.push(this.reqClass(StringLiteral));
            return; //* *** early exit
        }
        if (t.value == "match") { // Rust match expression
            this.name = 'match';
            this.children.push(this.reqClass(MatchExpression));
            return; //* *** early exit
        }
        if (t.value == "[") { // array expression
            this.name = 'array expression';
            this.children.push(this.reqClass(ArrayLiteral));
            return; //* *** early exit
        }
        if (t.value == "(") { // parenthized expression
            this.name = 'parentized';
            this.children.push(this.reqClass(ParenExpression));
            return; //* *** early exit
        }
        if (t.value == "|") { // closure expression
            this.name = 'closure';
            this.children.push(this.reqClass(RustClosure));
            return; //* *** early exit
        }
        if (t.value == "let") { // if let => destructuring, check if the Rvalue is of the Lvalue struct
            this.name = 'if-let';
            this.req("let");
            this.reqChild(Operand); // expression like Some(a / Foo::Bar / Foo::Bar { field })
            this.req("=");
            this.reqChild(Identifier); // rvalue is the variable to check against lvalue
            return; //* *** early exit
        }
        if (t.value == "if") { // let x = if... if expression
            this.name = 'if-expr';
            this.reqChild(IfStatement); // expression like Some(a / Foo::Bar / Foo::Bar { field })
            return; //* *** early exit
        }
        // here, the OPERAND is a var reference, fn-call or macro!
        this.owner.lexer.savePosition();
        const vr = this.reqClass(VarRef);
        // let's see if this is a macro! invocation
        if (this.owner.lexer.token.value == '!') { // it's a macro!
            this.owner.lexer.restoreSavedPosition();
            this.keyword = "macro!";
            this.name = vr.name;
            this.children.push(this.reqClass(MacroInvocation));
            return; //* *** early exit
        }
        // it's not a macro, last options are var reference or fn-call
        // the vr is good for both
        this.owner.lexer.discardSavedPosition();
        // let's see if this is a struct instantiation expression
        // rust's struct instantiation can only be detected by 'Self {...' or 'Declared-Struct-Type-Name {...' used as a statement
        // ojo ambiguos if we're in [match expr '{' ... '}' ] - commented
        if (this.owner.lexer.token.value == "{" &&
            this.parent.parent.name != 'match' && // for all this statements { => start body
            this.parent.parent.name != 'if' &&
            this.parent.parent.name != 'for') { // it's a struct Instantiation
            const objectLiteral = this.reqClass(ObjectLiteral);
            objectLiteral.name = vr.name;
            objectLiteral.keyword = "struct-instantiation";
            this.children.push(objectLiteral);
            return; //* *** early exit
        }
        // last option, this is just a varRef acting as a expression
        this.name = vr.name;
        this.children.push(vr);
    }
    // --------
    produce() {
        this.produceChildren();
    }
}
exports.Operand = Operand;
// end class Operand
class FunctionArgument extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.lock();
        if (this.owner.lexer.token.value == "_") { //  _ => wildcard, ignore param
            this.name = "_";
            this.owner.lexer.advance();
            return; // early exit
        }
        this.optRef();
        this.optMut();
        this.expression = this.reqClass(Expression);
    }
} // end class FunctionArgument
exports.FunctionArgument = FunctionArgument;
// -----------
// ## Expression
// `Expression: [UnaryOper] Operand [Oper [UnaryOper] Operand]*`
// The expression class parses intially a *flat* array of nodes.
// After the expression is parsed, a *Expression Tree* is created based on operator precedence.
class Expression extends ASTBase_1.ASTBase {
    constructor() {
        super(...arguments);
        // ---------------------------
        this.growExpressionTree = function (arr) {
            // do while arr.length > 1
            while (arr.length > 1) {
                // find the one with highest precedence (lower number) to push down
                // (on equal precedende, we use the leftmost)
                let pos = -1;
                let minPrecedenceInx = 100;
                for (let inx = 0, item; inx < arr.length; inx++) {
                    item = arr[inx];
                    // debug "item at #{inx} #{item.name}, Oper? #{item instanceof Oper}. precedence:",item.precedence
                    if (item instanceof Oper) {
                        // if not item.pushed and item.precedence < minPrecedenceInx
                        if (!(item.pushed) && item.precedence < minPrecedenceInx) {
                            pos = inx;
                            minPrecedenceInx = item.precedence;
                        }
                    }
                }
                // end for
                // #control
                if (pos < 0) {
                    this.throwError("can't find highest precedence operator");
                }
                // Un-flatten: Push down the operands a level down
                const oper = arr[pos];
                oper.pushed = true;
                if (oper instanceof UnaryOper) {
                    // #control
                    if (pos === arr.length) {
                        this.throwError(`can't get RIGHT operand for unary operator '${oper}'`);
                    }
                    // # if it's a unary operator, take the only (right) operand, and push-it down the tree
                    oper.right = arr.splice(pos + 1, 1)[0];
                }
                else {
                    // #control
                    if (pos === arr.length) {
                        this.throwError(`can't get RIGHT operand for binary operator '${oper}'`);
                    }
                    if (pos === 0) {
                        this.throwError(`can't get LEFT operand for binary operator '${oper}'`);
                    }
                    // # if it's a binary operator, take the left and right operand, and push them down the tree
                    oper.right = arr.splice(pos + 1, 1)[0];
                    oper.left = arr.splice(pos - 1, 1)[0];
                }
                // loop #until there's only one operator
            }
            // Store the root operator
            this.root = arr[0];
        };
    }
    // ---------------------------
    parse() {
        const arr = [];
        this.operandCount = 0;
        this.ternaryCount = 0;
        // (performance) Fast exit for no-expression `);{` => end of expression.
        if (');}'.includes(this.owner.lexer.token.value)) {
            return; // early exit
        }
        while (true) {
            // Get optional unary operator
            // (performance) check token first
            if (['+', '-', '!'].includes(this.owner.lexer.token.value)) {
                const unaryOper = this.opt(UnaryOper);
                if (unaryOper) {
                    arr.push(unaryOper);
                    this.lock();
                }
            }
            // Get operand
            arr.push(this.reqClass(Operand));
            this.operandCount++;
            this.lock();
            // (performance) Fast exit for common tokens: `=> , ] ) ; { ` => end of expression.
            if (this.owner.lexer.token.value == "=>" || ',]);{'.includes(this.owner.lexer.token.value)) {
                break; // early exit
            }
            // Try to parse next token as an operator
            const oper = this.opt(Oper);
            // if no oper then break # no more operators, end of expression
            if (!oper) {
                break;
            }
            // If it was an operator, store, and continue because we expect another operand.
            // (operators sits between two operands)
            arr.push(oper);
        }
        // Now we create a tree from .arr[], based on operator precedence
        this.growExpressionTree(arr);
    }
    static checkNativeRustConversionMapCollect(node) {
        if (node.tokVal() == ".") {
            node.nativeSuffixes = node.reqClass(RustNativeSuffixes);
        }
    }
}
exports.Expression = Expression;
// end class Expression
class RustNativeSuffixes extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        // check for .into() o .as_u128() .to_vec() .map() . collect() etc,
        while (this.owner.lexer.token.value == '.') {
            this.owner.lexer.advance();
            if (this.owner.lexer.token.tokenCode == Lexer_1.TokenCode.NUMBER) {
                // tuple item acess
                this.reqChild(NumberLiteral);
            }
            else {
                const suffix = this.reqClass(Identifier);
                if (this.opt("(")) {
                    if (suffix.name == "map" || suffix.name == "filter") { // .map() && filter param are rust's closures
                        suffix.reqChild(RustClosure);
                    }
                    else if (this.tokVal() != ')') { // has parameters
                        suffix.reqChild(Expression);
                    }
                    this.req(")");
                }
            }
        }
    }
}
exports.RustNativeSuffixes = RustNativeSuffixes;
// ## NameValuePair
// `NameValuePair: (IDENTIFIER|StringLiteral|NumberLiteral) ':' Expression`
// A single item inside a `ObjectLiteral / StructInstantiation.value`
// a `property-name: value` pair.
class NameValuePair extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.owner.lexer.savePosition();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        if (this.opt(':')) { // por alguna razon en rust decidieron q se podia instanciar un obj por posicion, los : son opcionales
            this.owner.lexer.discardSavedPosition();
            this.lock();
            this.value = this.reqClass(Expression);
        }
        else {
            // asumpo posicional
            this.owner.lexer.restoreSavedPosition();
            this.name = "[positional]";
            this.value = this.reqClass(Expression);
        }
    }
    // ---------------------------
    produce() {
        this.owner.codeWriter.write(this.name);
        this.owner.codeWriter.write(" : ");
        this.value.produce();
    }
}
exports.NameValuePair = NameValuePair;
class ObjectLiteral extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('{');
        this.lock();
        this.children = this.optSeparatedList(NameValuePair, ',', '}');
        Expression.checkNativeRustConversionMapCollect(this); // veo si tiene una llamada a .to_vec() u otra conversi�n
    }
    // ---------------------------
    forEach(callback) {
        // for each nameValue in .items
        for (const nameValue of this.children) {
            callback(nameValue);
        }
    }
    // ---------------------------
    produce() {
        this.owner.codeWriter.write("{");
        this.produceChildren("," + os_1.EOL);
        this.owner.codeWriter.write("}");
    }
}
exports.ObjectLiteral = ObjectLiteral;
class StaticDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('static');
        // At this point we lock because it is definitely a `static` declaration. Failure to parse the expression
        // from this point is a syntax error.
        this.lock();
        // After the word 'static' we require an identifier:type=value
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        this.req(":");
        this.reqChild(TypeAnnotation);
        this.req("=");
        this.reqChild(Expression);
    }
}
exports.StaticDeclaration = StaticDeclaration;
// end static place declaration
// ## ArrayLiteral
// `ArrayLiteral: '[' (Expression,)* ']'`
// An array definition, such as `a = [1,2,3]`
class ArrayLiteral extends ASTBase_1.ASTBase {
    constructor() {
        super(...arguments);
        this.items = [];
    }
    // ---------------------------
    parse() {
        this.req('[');
        this.lock();
        // closer "]" required
        this.items = this.optSeparatedList(Expression, ',', ']');
    }
} // end class ArrayLiteral
exports.ArrayLiteral = ArrayLiteral;
class ConstDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('const');
        // At this point we lock because it is definitely a `const` declaration. Failure to parse the expression
        // from this point is a syntax error.
        this.lock();
        // After the word 'const' we require an identifier
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        this.req(":");
        this.reqChild(TypeAnnotation);
        this.req("=");
        this.reqChild(Expression);
    }
}
exports.ConstDeclaration = ConstDeclaration;
// end ConstValueDeclaration
// ## ParenExpression
// `ParenExpression: '(' Expression ')'`
// An expression enclosed by parentheses, like `(a + b)`.
class ParenExpression extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('(');
        this.lock();
        while (true) {
            this.reqChild(Expression);
            if (this.opt(",")) {
                // tuple paren expression
                this.keyword = "tuple";
                continue;
            }
            else {
                break;
            }
        }
        this.req(')');
        Expression.checkNativeRustConversionMapCollect(this); // veo si tiene una llamada a .to_vec() u otra conversion
    }
}
exports.ParenExpression = ParenExpression;
// end class ParenExpression
/**
 * a type annotation with optional <type-paramenters,...>
 *      IDENT [ '<' (type-paramenter,) '>' ]
 * */
class TypeAnnotation extends ASTBase_1.ASTBase {
    parse() {
        this.optRef();
        this.optMut();
        if (this.opt("(")) { // tuple type annotation
            this.lock();
            this.keyword = "tuple type";
            this.name = "(tuple)";
            this.children = this.reqSeparatedList(TypeAnnotation, ',', ')');
        }
        else if (this.opt("[")) { // arr type annotation
            this.lock();
            this.keyword = "arr type";
            this.name = "(arr)";
            this.reqChild(Identifier);
            if (this.opt(";")) {
                this.reqChild(NumberLiteral);
            }
            this.req("]");
        }
        else {
            const ident = this.reqClass(Identifier);
            this.name = ident.name; // composed::namespace::name
            // check for (nested) type parameters
            const initial = (this.opt('<') || this.opt("<'"));
            if (initial) {
                this.typeParams = DelimitedWordList.parseAfter(initial, this, '<', '>');
            }
        }
    }
}
exports.TypeAnnotation = TypeAnnotation;
/**
 * class UseDeclaration
 *      'use' WORD ([::WORD...]  | '{' (Identifier,) '}' | * )
 * */
class UseDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('use');
        this.lock();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        while (this.owner.lexer.token.value == '::') {
            this.name += '::';
            const nextValue = this.owner.lexer.advance();
            if (nextValue == '{') { // special rust case, several use declarations sharing the same root
                this.owner.lexer.advance();
                this.children = this.reqSeparatedList(Identifier, ",", "}");
                break; // no more ::'s possible
            }
            else if (nextValue == '*') { // special: all items
                this.name += '*';
                this.owner.lexer.advance();
                break; // no more ::'s possible
            }
            else { // more indentifiers
                this.name += this.reqToken(Lexer_1.TokenCode.WORD);
            }
        }
    }
}
exports.UseDeclaration = UseDeclaration;
class ModDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('mod');
        this.lock();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        Body.optIntoChildren(this);
    }
}
exports.ModDeclaration = ModDeclaration;
class TypeDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('type');
        this.lock();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        this.req('=');
        this.reqChild(Expression);
    }
}
exports.TypeDeclaration = TypeDeclaration;
class DelimitedWordList {
    static parse(node, opener, closer) {
        const initial = node.req(opener);
        return DelimitedWordList.parseAfter(initial, node, opener, closer);
    }
    static parseOpened(node, opener, closer) {
        return DelimitedWordList.parseAfter(opener, node, opener, closer);
    }
    static parseAfter(initial, node, opener, closer) {
        // read balanced openers/closers { } / () or up to ;
        // because it's a "macro" anything goes (can't use AST Body parser)
        const macroWords = [];
        macroWords.push(initial);
        let openBalance = 1;
        while (openBalance > 0) {
            const word = node.owner.lexer.advance();
            if (opener && word == opener) {
                openBalance++;
            }
            else if (word == closer) {
                openBalance--;
            }
            macroWords.push(word);
        }
        node.owner.lexer.advance(); // consume the closer
        return macroWords;
    }
}
exports.DelimitedWordList = DelimitedWordList;
class MacroInvocation extends ASTBase_1.ASTBase {
    constructor() {
        super(...arguments);
        this.macroWords = [];
    }
    // ---------------------------
    parse() {
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        this.name += this.req('!');
        this.lock();
        // handle standard rust macro parameter delimiters
        const initial = this.owner.lexer.token.value;
        let opener = initial;
        let closer;
        if (initial == '{') {
            closer = '}';
        }
        else if (initial == '(') {
            closer = ')';
        }
        else if (initial == '[') {
            closer = ']';
        }
        else {
            opener = undefined;
            closer = ';';
        }
        // special recognized macros: assert_eq!(a,b) => expect(a).toBe(b)
        if (this.name == "assert_eq!" && opener == "(") {
            // parse the 2 expression and store at children[]
            this.req("(");
            this.reqChild(Expression);
            this.req(",");
            this.reqChild(Expression);
            if (this.opt(",")) { // third parameter, message if asssert failed
                this.reqChild(Expression);
            }
            this.req(")");
        }
        else {
            // read balanced openers/closers { } / () or up to ;
            // because it's a "macro" anything goes (can't use AST Body parser)
            this.macroWords = DelimitedWordList.parseAfter(initial, this, opener, closer);
        }
        // check if the macro!() ends with .into() .as_bytes() .as_U128() etc
        Expression.checkNativeRustConversionMapCollect(this);
        this.owner.lexer.semiNotRequired = true; // no need for a semicolon after this
    }
    toString() {
        return Function.apply(ASTBase_1.ASTBase.toString, this) + ' ' + this.macroWords.join(' ');
    }
}
exports.MacroInvocation = MacroInvocation;
class StructDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('struct');
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        this.req('{');
        this.children = this.reqSeparatedList(VariableDecl, ",", "}");
    }
}
exports.StructDeclaration = StructDeclaration;
class EnumItem extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        if (this.opt('{')) {
            this.children = this.reqSeparatedList(VariableDecl, ",", "}");
        }
    }
}
exports.EnumItem = EnumItem;
class EnumDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('enum');
        this.lock();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        this.req('{');
        this.children = this.reqSeparatedList(EnumItem, ",", "}");
    }
}
exports.EnumDeclaration = EnumDeclaration;
class ImplDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('impl');
        this.lock();
        const ident = this.reqClass(Identifier);
        this.name = ident.name;
        if (this.opt('for')) {
            this.for = this.reqClass(Identifier);
        }
        this.req("{");
        Body.parseIntoChildren(this); // parse as a Body (no separator, several fn { } blocks) => children
    }
}
exports.ImplDeclaration = ImplDeclaration;
/**
 * A single-line attribute
 * comments attached to statements are stored in Statement.comment
 * */
class LineAttribute extends ASTBase_1.ASTBase {
    parse() {
        this.name = this.reqToken(Lexer_1.TokenCode.ATTRIBUTE);
    }
}
exports.LineAttribute = LineAttribute;
class IdentifierMaybeTuple extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        if (this.opt("(")) {
            this.lock();
            this.children = this.reqSeparatedList(Identifier, ",", ")"); // closure params as tuples?
        }
        else {
            this.reqChild(Identifier);
        }
    }
}
exports.IdentifierMaybeTuple = IdentifierMaybeTuple;
// ## RustClosure
//
// `RustClosure: ` '|' (WORD,...) '|' ( Body | Expression | fn-call ) `
//
class RustClosure extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('|');
        this.lock();
        if (this.opt("(")) {
            this.params = this.reqSeparatedList(Identifier, ",", ")"); // closure params as tuples?
            this.req('|');
        }
        else {
            this.params = this.reqSeparatedList(Identifier, ",", "|"); // closure params
        }
        // it's a body?
        if (this.opt('{')) {
            Body.parseIntoChildren(this);
        }
        else {
            // let's assume it is an Expression
            this.children.push(this.reqClass(Expression));
        }
    }
}
exports.RustClosure = RustClosure;
// end class RustClosure
// ## MatchPair
//
// `MatchPair: ` (Expression | '_' ) '=>' Expression
//
class MatchPair extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        if (this.opt('_')) {
            this.left = null;
        }
        else {
            this.left = this.reqClass(Expression);
        }
        this.req("=>");
        if (this.owner.lexer.token.value == "{") { // match pair right item is a block
            this.right = this.reqClass(Body);
        }
        else {
            this.right = this.reqClass(Expression);
        }
    }
    toString() {
        return Function.apply(ASTBase_1.ASTBase.toString, this) + (this.left ? this.left.name : '_') + " => " + this.right.name;
    }
}
exports.MatchPair = MatchPair;
// ## MatchExpression
//
// `MatchExpression: ` match Expression '{' ( (Expression | '_' ) => Expression ,... ) '}'`
//
class MatchExpression extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('match');
        this.lock();
        this.exprToMatch = this.reqClass(Expression);
        this.req('{');
        this.children = this.optSeparatedList(MatchPair, ",", "}");
        Expression.checkNativeRustConversionMapCollect(this); // veo si tiene una llamada a .to_vec() u otra conversi�n
    }
}
exports.MatchExpression = MatchExpression;
// end class MatchExpression
// ## FunctionDeclaration
//
// `FunctionDeclaration: 'function [IDENTIFIER] ["(" [VariableDecl,]* ")"] [returns type-VariableRef] Body`
//
// Functions: parametrized pieces of callable code.
//
class FunctionDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        // manage special keywords like 'pub'
        this.optPub();
        this.req('fn');
        this.lock();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        // get parameters declarations
        this.paramsDeclarations = this.opt(FunctionParameters);
        // get the return-type (optional)
        if (this.opt('->')) {
            this.typeAnnotation = this.reqClass(TypeAnnotation);
        }
        // now parse the body
        if (this.owner.lexer.token.value == ";") {
            // just a fn signature declaration (no body)
        }
        else {
            if (this.owner.options.skipFunctionBody) { //do not parse function body
                DelimitedWordList.parse(this, "{", "}");
            }
            else {
                Body.parseIntoChildren(this);
            }
        }
    }
}
exports.FunctionDeclaration = FunctionDeclaration;
// end class FunctionDeclaration
/**
 * [pub mut &] Name,Type and optional assignment
 *
 * Identifier: TypeAnnotation [ = Expression ]
 *
 * */
class VariableDecl extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        // manage special keywords like 'pub' & mut
        this.optPub();
        this.optRef();
        this.optMut();
        this.optDecorators();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        this.lock();
        // if .parent instance of VarStatement
        if (this.parent instanceof LetStatement && RESERVED_WORDS.indexOf(this.name) >= 0) {
            this.sayErr(`"${this.name}" is a reserved word`);
        }
        // optional type annotation
        if (this.opt(':')) {
            this.typeAnnotation = this.reqClass(TypeAnnotation);
        }
        // optional assigned value
        if (this.opt('=')) {
            this.assignedExpression = this.reqClass(Expression);
        }
    }
    toString() {
        return (this.isRef ? "&" : "") + (this.isMut ? "mut " : "") + this.name + (this.typeAnnotation ? this.typeAnnotation.name + ":" : "");
    }
}
exports.VariableDecl = VariableDecl;
// end class VariableDecl
class LetStatement extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('let');
        this.optMut();
        this.lock();
        if (this.opt("(")) { // tuple assignment
            this.keyword = "tuple";
            this.children = this.reqSeparatedList(Identifier, ',', ')');
            // optional assigned value
            if (this.opt('=')) {
                this.children.push(this.reqClass(Expression));
            }
        }
        else {
            this.children = this.reqSeparatedList(VariableDecl, ',', ';');
        }
    }
}
exports.LetStatement = LetStatement;
// ------------------
class FunctionParameters extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        // if we define a list of specific parameters, fuction is no longer variadic
        this.lock();
        this.req('(');
        this.children = this.optSeparatedList(VariableDecl, ',', ')');
    }
    toString() {
        return "(" + this.children.map((c) => c.toString()).join(",") + ")";
    }
} // end class FunctionParameters
exports.FunctionParameters = FunctionParameters;
// ------------------------------------------
class TraitDeclaration extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('trait');
        this.lock();
        this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        // See if there is an inheritance declaration
        if (this.opt(':')) {
            // now a list of references (to other traits, separated by "+", ended by the "{" )
            this.traitAncestors = this.reqSeparatedList(Identifier, '+', '{');
        }
        // Now get the trait body
        this.req("{");
        Body.parseIntoChildren(this);
    }
}
exports.TraitDeclaration = TraitDeclaration;
// end class TraitDeclaration
/**
 * 'return' [Expression]
 * */
class ReturnStatement extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('return');
        this.lock();
        this.optChild(Expression);
    }
}
exports.ReturnStatement = ReturnStatement;
// end class ReturnStatement
// ---------------------------
class IfStatement extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('if');
        this.lock();
        this.conditional = this.reqClass(Expression);
        Body.reqAsChild(this, "then-block"); // first child, then block
        if (this.opt('else')) {
            Body.reqAsChild(this, "else-block"); // second child, optional else block
        }
    }
}
exports.IfStatement = IfStatement;
// end class IfStatement
// ---------------------------
class WhileStatement extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.req('while');
        this.lock();
        this.conditional = this.reqClass(Expression);
        this.req("{");
        Body.parseIntoChildren(this);
    }
    toString() {
        return Function.apply(ASTBase_1.ASTBase.toString, this) + ' ' + this.conditional.name;
    }
}
exports.WhileStatement = WhileStatement;
// end class WhileStatement
// ## Range Expression
class RangeExpression extends ASTBase_1.ASTBase {
    constructor() {
        super(...arguments);
        this.inclusive = false;
    }
    // ---------------------------
    parse() {
        this.reqChild(Expression);
        this.req('..');
        if (this.opt("="))
            this.inclusive = true;
        this.reqChild(Expression);
    }
} // end class RangeExpression
exports.RangeExpression = RangeExpression;
// ## For Statement
class ForStatement extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        // We start with commonn `for` keyword
        this.req('for');
        this.lock();
        this.ident = this.reqClass(IdentifierMaybeTuple);
        this.req('in');
        this.range = this.reqClass(Expression);
        this.req('{');
        Body.parseIntoChildren(this); // first child, then block
    }
} // end class ForStatement
exports.ForStatement = ForStatement;
// -----------------------
// ## Accessors
// `Accessors: (PropertyAccess | FunctionAccess | IndexAccess)`
// Accessors:
// `PropertyAccess: '.' IDENTIFIER`
// `IndexAccess: '[' Expression ']'`
// `FunctionAccess: '('[Expression,] * ')'`
// Accessors can appear after a VariableRef (most common case)
// but also after a String constant, a Regex Constant,
// a ObjectLiteral and a ArrayLiteral
// Examples:
// - `myObj.item.fn(call)`  <-- 3 accesors, two PropertyAccess and a FunctionAccess
// - `myObj[5](param).part`  <-- 3 accesors, IndexAccess, FunctionAccess and PropertyAccess
// - `[1, 2, 3, 4].indexOf(3)` <-- 2 accesors, PropertyAccess and FunctionAccess
// #####Actions:
// `.` -> PropertyAccess: Search the property in the object and in his pototype chain.
// It resolves to the property value
// `[...]` -> IndexAccess: Same as PropertyAccess
// `(...)` -> FunctionAccess: The object is assumed to be a function, and the code executed.
// It resolves to the function return value.
// ## Implementation
// We provide a class Accessor to be super class for the three accessors types.
class Accessor extends ASTBase_1.ASTBase {
    static parseAccessors(node) {
        let accessorFound = true;
        // Loop parsing accessors
        while (accessorFound) {
            if (node.owner.lexer.token.tokenCode == Lexer_1.TokenCode.COMMENT) { // skip comments
                node.owner.lexer.advance();
                continue;
            }
            switch (node.owner.lexer.token.value) {
                case '.': // . => property acceess
                    node.reqChild(PropertyAccess);
                    node.isFunctionCall = false;
                    break;
                case '(': // ( => function access
                    node.reqChild(FunctionAccess);
                    node.isFunctionCall = true; // if the very last accesor is "(", it means the entire expression is a function call
                    node.hasSideEffects = true; // if any accessor is a function call, this statement is assumed to have side-effects
                    break;
                case '[': // [ => array access
                    node.reqChild(IndexAccess);
                    node.isFunctionCall = false;
                    break;
                default:
                    accessorFound = false;
            }
        }
    }
}
exports.Accessor = Accessor;
// end class Accessor
class FunctionAccess extends Accessor {
    // ---------------------------
    parse() {
        this.req('(');
        this.lock();
        this.children = this.optSeparatedList(FunctionArgument, ',', ')');
    }
    // ---------------------------
    toString() {
        return '(...)';
    }
    produce() {
        const o = this.owner.codeWriter;
        // function accessor => function call
        o.write("(");
        this.produceChildren(", ");
        o.write(")");
    }
}
exports.FunctionAccess = FunctionAccess;
// end class FunctionAccess
class PropertyAccess extends Accessor {
    // ---------------------------
    parse() {
        this.req('.');
        this.lock();
        // check for NumberLiteral  x.0 rust tuple dot-index access. https://stackoverflow.com/questions/32030756/reasons-for-dot-notation-for-tuple
        if (this.owner.lexer.token.tokenCode == Lexer_1.TokenCode.NUMBER) {
            this.keyword = "tuple-index";
            this.extraInfo = this.owner.lexer.token.value;
            this.owner.lexer.advance();
        }
        else {
            // let's assume .field access
            this.name = this.reqToken(Lexer_1.TokenCode.WORD);
        }
    }
    // ---------------------------
    toString() {
        return `.${this.name} `;
    }
    produce() {
        const o = this.owner.codeWriter;
        // function accessor => function call
        o.write(".");
        o.write(this.name);
    }
}
exports.PropertyAccess = PropertyAccess;
// end class PropertyAccess
class IndexAccess extends Accessor {
    // ---------------------------
    parse() {
        this.name = this.req('[');
        this.lock();
        this.reqChild(Expression);
        this.req(']');
    } // ---------------------------
    toString() {
        return '[...]';
    }
    produce() {
        const o = this.owner.codeWriter;
        // function accessor => function call
        o.write("[");
        this.produceChildren();
        o.write("]");
    }
}
exports.IndexAccess = IndexAccess;
// end class IndexAccess
// -----------------------
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
class VarRef extends ASTBase_1.ASTBase {
    // ---------------------------
    parse() {
        this.preIncDec = this.optList(['--', '++']);
        this.isFunctionCall = false;
        this.optMut();
        this.optRef();
        this.optDeRef();
        this.name = this.reqClass(Identifier).name;
        this.lock();
        // Now we check for accessors:
        // <br>`.`->**PropertyAccess**
        // <br>`[...]`->**IndexAccess**
        // <br>`(...)`->**FunctionAccess**
        // Note: **.paserAccessors()** will:
        // - set .hasSideEffects=true if a function accessor is parsed
        // - set .isFunctionCall=true if the last accessor is a function accessor
        // .parseAccessors
        Accessor.parseAccessors(this);
        // .postIncDec = .opt('--','++')
        this.postIncDec = this.optList(['--', '++']);
        // If this variable ref has ++ or --, IT IS CONSIDERED a "call to execution" in itself,
        // a "imperative statement", because it has side effects.
        // (`i++` has a "imperative" part, It means: "give me the value of i, and then increment it!")
        if (this.preIncDec || this.postIncDec) {
            this.isFunctionCall = true;
            this.hasSideEffects = true;
        }
    }
    // ---------------------------
    toString() {
        // This method is only valid to be used in error reporting.
        // function accessors will be output as "(...)", and index accessors as [...]
        let result = `${this.preIncDec || ''}${this.name}`;
        if (this.children) {
            for (const ac of this.children) {
                result = `${result}${ac.toString()} `;
            }
        }
        return `${result}${this.postIncDec || ''}`;
    }
}
exports.VarRef = VarRef;
// end class VariableRef
// ##Statement
// A `Statement` is an imperative statment (command) or a control construct.
// The `Statement` node is a generic container for all previously defined statements.
// The generic `Statement` is used to define `Body: (Statement;)`, that is,
//* *Body** is a list of semicolon (or NEWLINE) separated **Statements**.
// Grammar:
// ```
// Statement: [Adjective]* (TraitDeclaration|FunctionDeclaration
// |IfStatement|ForStatement|WhileUntilLoop|DoLoop
// |AssignmentStatement
// |LoopControlStatement|ThrowStatement
// |TryCatch|ExceptionBlock
// |ReturnStatement|PrintStatement|DoNothingStatement)
// Statement: ( AssignmentStatement | fnCall-VariableRef [ ["("] (Expression,) [")"] ] )
// ```
// public class Statement extends ASTBase
// constructor
class Statement {
    // ---------------------------
    /** static Statement.tryParse
     *  try to parse a statement and return the specific node found | throws
     * @param node
     */
    static tryParse(node) {
        node.lock(); // no other option than a statement
        // manage rust attributes (lines starting with #)
        if (node.owner.lexer.token.tokenCode == Lexer_1.TokenCode.ATTRIBUTE) {
            return node.reqClass(LineAttribute);
        }
        // manage special keywords like 'pub'
        const isPublic = (node.opt('pub') == 'pub');
        const key = node.owner.lexer.token.value;
        const resultASTNode = Statement.tryParseByKeyword(node, key);
        resultASTNode.keyword = key;
        resultASTNode.isPublic = isPublic;
        Expression.checkNativeRustConversionMapCollect(resultASTNode); // veo si tiene una llamada a .to_vec() u otra conversi�n
        return resultASTNode;
    }
    static tryParseByKeyword(node, key) {
        // manage rust macros
        if (node.owner.lexer.nextToken().value == '!') { // it's a macro!
            return node.reqClass(MacroInvocation);
        }
        // rust expression as as statement, discarded or returned if it is the last expression in the function
        if (key == '(') { // it's a (Expression-maybeReturn-Statement)
            return node.reqClass(Expression);
        }
        // Now we can look up the keyword in the **StatementsDirect** table, and parse the specific AST node
        const ClassByKeyword = Statement.DirectKeywordMap[key];
        if (ClassByKeyword) {
            // keyword found, use the AST class to parse
            return node.reqClass(ClassByKeyword);
        }
        // if keyword not found in table
        // It's an expression
        return node.reqClass(Expression);
        // let's asume it's a fn call or an assignment statement
        // lets try then to parse a varRef, that could result in a fn-call or in an L-Value for an assignment
        const vr = node.reqClass(VarRef);
        if (vr.isFunctionCall) { // it was a fn call
            return vr;
        }
        // let's see if node is a struct instantiation expression
        // rust's struct instantiation have the form: IDENT ObjectLiteral
        // ObjectLiteral  = '{' [ NameValuePair, ] '}'
        if (node.owner.lexer.token.value == "{") { // let's assume is a Struct Instantiation
            // it's a Struct Instantiation
            const objectLiteral = node.reqClass(ObjectLiteral);
            objectLiteral.name = vr.name;
            objectLiteral.keyword = "struct-instantiation";
            return objectLiteral;
        }
        // it wasn't a function call,
        // if there's an assignmen token => AssignmentStatement
        // else is just an expression-maybe-return-value
        if (node.owner.lexer.token.tokenCode == Lexer_1.TokenCode.OPERATOR) {
            // it's is an AssignmentStatement
            // const assignmentStatement = node.reqClass(AssignmentStatement) as AssignmentStatement
            // assignmentStatement.lvalue = vr //complete the AssignmentStatement L-value with the prevously parsed VarRef
            // return assignmentStatement
        }
        // finally, just a expression
        // the preParsedVarRef is just a R-Value, an expression-maybe-return-value
        return vr;
    }
}
exports.Statement = Statement;
// ----------------------------------------
// Table-based (fast) Statement parsing
// ------------------------------------
// This a extension to PEGs.
// To make the compiler faster and easier to debug, we define an
// object with name-value pairs: `"keyword" : AST node class`
// We look here for fast-statement parsing, selecting the right AST node to call `parse()` on
// based on `token.value`. (instead of parsing by ordered trial & error)
// This table makes a direct parsing of almost all statements, thanks to a core definition of LiteScript:
// Anything standing alone in it's own line, its an imperative statement (it does something, it produces effects).
Statement.DirectKeywordMap = {
    use: UseDeclaration,
    mod: ModDeclaration,
    const: ConstDeclaration,
    static: StaticDeclaration,
    trait: TraitDeclaration,
    type: TypeDeclaration,
    '#': LineAttribute,
    struct: StructDeclaration,
    enum: EnumDeclaration,
    impl: ImplDeclaration,
    fn: FunctionDeclaration,
    let: LetStatement,
    if: IfStatement,
    while: WhileStatement,
    for: ForStatement,
    match: MatchExpression,
    return: ReturnStatement,
};
// end class Statement
// ## Body
// a Body is a (optional)semicolon-separated list of statements (At least one) ending with a "closer", either '}' or EOF
// Body is used for "fn" body, for body, if& else bodies, etc.
// Anywhere a list of semicolon separated statements apply.
/**
 * '{' [Statements;] '}'
 * */
class Body extends ASTBase_1.ASTBase {
    parse() {
        this.req("{");
        this.lock();
        Body.parseIntoChildren(this);
    }
    // ---------------------------
    produce() {
        this.produceBody(4);
    }
    // ---------------------------
    static reqAsChild(parent, name = "Body") {
        const newBlock = parent.reqClass(Body);
        newBlock.name = name;
        parent.children.push(newBlock);
    }
    // ---------------------------
    static optIntoChildren(node, closer = "}") {
        if (node.opt("{")) {
            Body.parseIntoChildren(node, closer);
        }
    }
    // ---------------------------
    static parseIntoChildren(node, closer = "}") {
        node.lock();
        // We accept statements and comments as items in the body
        // A Body is a list of Statements|LineComments separated by *semicolon* and, closed by "}"
        const separator = ';';
        logger.debug(`Body for ${node.constructor.name}: get LineComments & Statements separated by '${separator}' closer:`, closer || ' to EOF');
        while (true) {
            node.owner.lexer.skipWhiteSpaceAndNewLine();
            // pre comments and attrs
            const preComments = [];
            node.owner.lexer.consumeCommentsAndAttr(preComments);
            if (node.owner.lexer.token.tokenCode == Lexer_1.TokenCode.EOF)
                break; // break on EOF
            if (closer && node.opt(closer))
                break; // on closer:'}', break - end of body, (a single extra separator before closer is allowed)
            if (logger.debugFrom && node.owner.lexer.token.line > logger.debugFrom)
                logger.setDebugLevel(1);
            if (logger.debugTo && node.owner.lexer.token.line > logger.debugTo)
                logger.setDebugLevel(0);
            // -----------------------
            // here we assume it's a Statement
            // Statement.tryParse will return the right AST class parsed
            const statement = Statement.tryParse(node);
            // attach pre-comments to the statement
            statement.commentsAndAttr = preComments;
            // keep a dict of declaredStructs in order to be able to recognize struct instantiation
            // (there's no keyword in a struct instantiation, just the struct's name | Self)
            if (statement instanceof StructDeclaration) {
                node.owner.declaredStructs[statement.name] = statement;
            }
            // add post comments and attr - NO, se come precomments del sieguiente after a struct { }
            // node.owner.tokenizer.consumeCommentsAndAttr(item.commentsAndAttr)
            node.children.push(statement);
            if (node.opt(closer))
                break; // if closer '}' found here, break - end of body
            // special case: check if now comes a separator (;) followed of a comment on the same line...
            statement.attachedComment = node.owner.lexer.getAttachedCommentAfter(separator);
            if (statement.attachedComment) {
                // keep the comments atttached to the statement
                continue; // Next sentence, separator found and consumed
            }
            // if the statement had a body defined by { }, or the statemente consumend the separator ";" -- it's OK
            if (node.owner.lexer.token.value != separator) {
                // allow exceptions, separator is not required
                continue;
            }
            // if there is a 'separator' (semicolon), let's consume it
            node.owner.lexer.semiNotRequired = false;
            node.req(separator);
        } // try another item after the separator
        logger.debug(`End Body on '${closer}'`);
        if (closer == '}')
            node.owner.lexer.semiNotRequired = true; // no need for a semicolon if closed by '}'
    }
}
exports.Body = Body;
// end class Body
// ## Module
// The `Module` represents a complete source file.
class ASTModule extends ASTBase_1.ASTBase {
    // ------------
    constructor(owner, filename) {
        super(null, filename);
        this.dependencyTreeLevel = 0;
        this.dependencyTreeLevelOrder = 0;
        this.importOrder = 0;
        this.owner = owner;
    }
    parse() {
        const closer = undefined; // parse until EOF
        Body.parseIntoChildren(this, closer);
    }
}
exports.ASTModule = ASTModule;
//# sourceMappingURL=Grammar.js.map