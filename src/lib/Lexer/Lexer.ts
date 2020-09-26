//The main class in this module is the Tokenizer.

//The Lexer translates code (a string or a file) into a list of anottated tokens ready to be parsed

//--eslint no-constant-condition: ["error", { "checkLoops": false }]*/

import "../util/String.extensions.js"

import { logger } from '../util/logger.js'

import { UTF8FileReader } from "../util/UTF8FileReader.js"

export enum TokenCode {
    BOF = 0,
    EOF,
    NEWLINE,
    WHITESPACE,
    COMMENT,
    ATTRIBUTE,
    PUNCTUATION,
    WORD,
    OPERATOR,
    ASSIGNMENT, // Assignment operators = += /= *=, etc
    NUMBER,
    HEXANUMBER,
    BINARYNUMBER,
    LITERAL_STRING,
    LITERAL_OBJECT,
}

//----------------------
//The Token Class
//===============

//Each token instance has:
//-a "type" e.g.: NEWLINE,EOF, when the token is a special char
//-a "value": the parsed text
//-the column in the source line in which the token appears

//class Token
// constructor
export class Token {
    owner: Lexer
    tokenCode: TokenCode
    value: string
    line: number
    col: number
    constructor(owner: Lexer, tokenCode: TokenCode, tokenText: string, line: number, column: number) {
        this.owner = owner
        this.tokenCode = tokenCode
        this.value = tokenText
        this.line = line
        this.col = column
    }
    // ---------------------------
    isSpace(): boolean { return this.tokenCode == TokenCode.NEWLINE || this.tokenCode == TokenCode.WHITESPACE }
    isEOF(): boolean { return this.tokenCode == TokenCode.EOF }

    // ---------------------------
    toString(): string {
        const code = TokenCode[this.tokenCode]
        if (this.tokenCode == TokenCode.BOF ||
            this.tokenCode == TokenCode.EOF ||
            this.tokenCode == TokenCode.WHITESPACE ||
            this.tokenCode == TokenCode.NEWLINE
        ) {
            return '(' + code + ')'
        }
        let v = this.value
        if (v && v.length > 20) v = v.slice(0, 17) + '...'
        return '(' + code + ' ' + v + ')'
    }
    posToString(): string {
        return `${this.owner.filename}:${this.line}:${(this.col)}`
    }
    toStringDebug(): string {
        return `${this.line}:${(this.col)} ${this.toString()}`
    }
}

//===============
//The Lexer Class
//===============
export class Lexer {

    token: Token //current token

    filename: string
    private file: UTF8FileReader
    private readString: string = '' //data already read from the file

    private curReadLine: number = 1
    private curReadCol: number = 1
    private cachedTokens: Token[]

    private savedPositions: Token[]

    hardError: Error
    softError: Error
    //outCode: OutCode
    private BOFToken: Token
    private EOFToken: Token

    autoSkipWhitespaceAndNewLine: boolean = true
    semiNotRequired: boolean = false

    static WHITESPACE_CHARS: string = ' \t\u00A0\u2028\u2029'
    
    /**
         * MAIN LEXER FUNCTION: recognizeToken
         * In this function you define the rules to tokenize the input stream 
         * the data to analize is at: this.readString
         * this.readString have the next 4Kb from the input stream
         * 
         * if the token is invalid, throw an error, else return [TokenCode, endPos]
         * where endPos is the position after the last character recognized
         * 
         * */
    private recognizeToken(): [TokenCode, number] {

        //fastest recognition based on 1st char
        const char = this.readString.charAt(0)
        const twoChars: string = this.readString.slice(0, 2)

        //based on 2-chars
        switch (twoChars) {
            case "//": {
                const endOfComment = this.untilNewLine()
                return [TokenCode.COMMENT, endOfComment]
            }
            case "#[": {
                const endPos = this.untilNewLine()
                return [TokenCode.ATTRIBUTE, endPos]
            }
            case '\r\n': {
                return [TokenCode.NEWLINE, 2]
            }
            //rust namespace separator
            case '::': {
                return [TokenCode.PUNCTUATION, 2]
            }
            //rust match pair: X => Y
            case '=>': {
                return [TokenCode.PUNCTUATION, 2]
            }
            // /* multiline comment
            case '/*': { 
                const endPos = this.findRead("*/")
                return [TokenCode.COMMENT, endPos+ 2] //includes opening /* and closing */
            }
            //rust 2-char special LITERAL_STRINGs
            //b"..." , r"..." 
            case 'b"': { //byte literal string
                const quoteChar = '"'
                const endQuotePos = this.untilUnescaped(quoteChar, 2)
                //return new Token 'LITERAL_STRING' 
                return [TokenCode.LITERAL_STRING, endQuotePos + 1] //includes opening (b") and closing quotes (")
            }

            //'0x' => Hexadecimal number, can inlude u64, u128
            case '0x': {
                const endPos = this.whileRanges('a-fA-F0-9u', 2)
                return [TokenCode.HEXANUMBER, endPos]
            }

            //'0b' => Binary number, , can inlude u64, u128
            case '0b': {
                const endPos = this.whileRanges('a-fA-F0-9u', 2)
                return [TokenCode.BINARYNUMBER, endPos]
            }

        }

        //based on single-char
        if (char == '\n') {
            return [TokenCode.NEWLINE, 1]
        }

        //check for NUMBER,, can inlude u64, u128
        if (char >= '0' && char <= '9') {
            let endPos = this.whileRanges('0-9._u')
            if (this.readString.charAt(endPos-1) == '.') endPos--; // can't end in '.'
            return [TokenCode.NUMBER, endPos]
        }

        if (Lexer.WHITESPACE_CHARS.includes(char)) {
            const endPos = this.whileRanges(Lexer.WHITESPACE_CHARS)
            return [TokenCode.WHITESPACE, endPos]
        }

        //rust 3-char assignment operators
        if (['<<=', '>>='].includes(this.readString.slice(0, 3))) {
            return [TokenCode.ASSIGNMENT, 3]
        }
        //rust 3-char operators
        if (['...', '..='].includes(this.readString.slice(0, 3))) {
            return [TokenCode.OPERATOR, 3]
        }

        //rust 2-char assignment operators
        if (['*=', '+=', '-=', '/=', '^=', '|=', '%=', '&='].includes(twoChars)) {
            return [TokenCode.ASSIGNMENT, 2]
        }
        //rust 2-char operators
        if (['!=', '&&', '||', '->', '..', '<=', '==', '>=', '>>'].includes(twoChars)) {
            return [TokenCode.OPERATOR, 2]
        }

        //assignment operator
        if (char == '=') {
            return [TokenCode.ASSIGNMENT, 1]
        }
        //rust 1-char operators
        if ('!%&*+-/<>@^|?'.includes(char)) {
            return [TokenCode.OPERATOR, 1]
        }

        //Punctuation: () [] {} ; , . : 
        if ('()[]{};,.:'.includes(char)) {
            return [TokenCode.PUNCTUATION, 1]
        }

        //String Literals can be either single or double quoted.
        //['STRING', /^'(?:[^'\\]|\\.)*'/],
        if (char == "'" || char == '"') {
            const quoteChar = char
            const endQuotePos = this.untilUnescaped(quoteChar, 1)
            //return new Token 'LITERAL_STRING' 
            return [TokenCode.LITERAL_STRING, endQuotePos + 1] //includes opening and closing quotes
        }

        //Regex tokens are regular expressions. The javascript producer, just passes the raw regex to JavaScript.
        //['REGEX', /^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/],
        //if chunk.startsWith('/') and chunk.indexOf('/',1) isnt -1
        //if (chunk.startsWith('/') && chunk.indexOf('/', 1) !== -1) {
        //    //var regexpContents = PMREX.quotedContent(chunk)
        //    var regexpContents = PMREX.quotedContent(chunk)
        //    //var regexpExpr:string = chunk.slice(0,regexpContents.length+2) //include quote-chars: / & /
        //    var regexpExpr = chunk.slice(0, regexpContents.length + 2)
        //    //var regexpFlags = PMREX.whileRanges(chunk.slice(regexpExpr.length),"gimy")
        //    var regexpFlags = PMREX.whileRanges(chunk.slice(regexpExpr.length), 'gimy')
        //    //return new Token('REGEX', regexpExpr & regexpFlags)
        //    return new Token('REGEX', regexpExpr + regexpFlags)
        //}

        //**Numbers** can be either in hex format (like `0xa5b`) or decimal/scientific format (`10`, `3.14159`, or `10.02e23`).
        //As in js, all numbers are floating point.

        //['NUMBER',/^0x[a-f0-9]+/i ],
        //['NUMBER',/^[0-9]+(\.[0-9]+)?(e[+-]?[0-9]+)?/i],

        //Identifiers (generally variable names), must start with a letter, `$`, or underscore.
        //Subsequent characters can also be numbers. Unicode characters are supported in variable names.
        //['IDENTIFIER',/^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*/] ]
        //a IDENTIFIER starts with A-Z a-z (a unicode codepoint), $ or _

        //note we checked for numbers above
        const endIdentifier = this.whileRanges('A-Za-z0-9\x7F-\xFF$_')
        if (endIdentifier) {
            return [TokenCode.WORD, endIdentifier]
        }

        throw new Error("unrecognized token")
    }

    /**
     * helper function to get comments attached after the semicolon in the same line of a statement
     * @param separator
     */
    getAttachedCommentAfter(separator: string): string {
        this.savePosition()
        this.skipWhiteSpace()
        if (this.token.value == separator) {
            this.skipWhiteSpace()
            if (this.token.tokenCode == TokenCode.COMMENT) {
                //comment after the separator, on the same line (no NEWLINE)
                this.discardSavedPosition()
                return this.token.value
            }
        }
        //if ;//comment not found - rewind
        this.restoreSavedPosition()
    }

    /**
     * helper function consume comments, return string
     */
    consumeCommentsAndAttr(storeInList: string[]): void {
        while (this.token.tokenCode == TokenCode.COMMENT || this.token.tokenCode == TokenCode.ATTRIBUTE) {
            storeInList.push(this.token.value)
            this.advance()
        }
    }

    /**
     * Init all the options for the tokenizer
     * @param options
     */
    constructor() {

        //this.project = project

        //use same options as compiler

        this.BOFToken = new Token(this, TokenCode.BOF, '', 0, 0)
        this.EOFToken = new Token(this, TokenCode.EOF, '', 0, 0)

        //stringInterpolationChar starts for every file the same: "#"
        //can be changed in-file with `tokenizer options` directive

        //.hardError = null # stores most significative (deepest) error, when parsing fails
        this.hardError = null

    }

    //--------
    private initTokenList() {
        this.savedPositions = []
        this.cachedTokens = []
        this.token = this.BOFToken
        if (this.autoSkipWhitespaceAndNewLine) {
            this.advance()
            this.skipWhiteSpaceAndNewLine()
        }
    }

    // ---------------------------
    startFromString(code: string) {
        this.readString = code
        this.initTokenList()
    }

    // ---------------------------
    /**
     * attach a file as input for the tokenizer
     * @param filename
     */
    openFile(filename: string): void {

        this.filename = filename

        this.file = new UTF8FileReader()
        this.file.open(filename, 8 * 1024) 

        //read the first chunk
        this.readString = this.file.readChunk()
        //start with Token:BOF
        this.initTokenList()
    }

    // ---------------------------
    savePosition() {
        this.savedPositions.push(this.token)
    }
    // ---------------------------
    discardSavedPosition(): void {
        this.savedPositions.pop() //discard saved pos
    }
    // ---------------------------
    /**
     * rewind the token stream to the last saved position
     * */
    restoreSavedPosition(): void {
        this.token = this.savedPositions.pop() //go back to saved position
    }

    //------------------------------
    prevToken(n: number = 1) {
        //veo si el actual está en el cache
        const inxInCached = this.indexInCached()
        if (inxInCached <= n - 1) { //si n=1 y esta en el index 0 (o no está), no se puede 
            throw new Error("Cant read previous [current - " + n + "] token")
        }
        //return tok at [current-n]
        return this.cachedTokens[inxInCached - n]
    }

    // ---------------------------
    rewind(n: number = 1) {
        const prev = this.prevToken(n)
        //do rewind
        this.token = prev
        logger.debug('<<REW -' + n, this.token.toStringDebug())
    }



    // ---------------------------
    private cacheOneMoreToken(): Token {

        const newToken = this.readNewToken()
        this.cachedTokens.push(newToken)
        return newToken
    }

    // ---------------------------
    private indexInCached() {
        //search if current token is in cached (from the last one to the first)
        for (let inx = this.cachedTokens.length - 1; inx >= 0; inx--) {
            const t = this.cachedTokens[inx]
            if (t.line == this.token.line && t.col == this.token.col) return inx
        }
        return -1
    }

    // ---------------------------
    /**
     * peek next token
     * */
    nextToken(): Token {

        //veo si está en el cache
        const inxInCached = this.indexInCached()
        if (inxInCached > 0 && inxInCached + 1 < this.cachedTokens.length) {
            return this.cachedTokens[inxInCached + 1]
        }
        //si no está agrego uno al cache y retorno ese
        return this.cacheOneMoreToken()
    }

    // ---------------------------
    skipWhiteSpaceAndNewLine() {
        //skip newlines & whitespace
        while (this.token.tokenCode == TokenCode.NEWLINE || this.token.tokenCode == TokenCode.WHITESPACE) {
            this.token = this.nextToken()
        }
    }
    // ---------------------------
    skipNewLines() {
        //skip newlines
        while (this.token.tokenCode == TokenCode.NEWLINE) {
            this.token = this.nextToken()
        }
    }
    // ---------------------------
    skipWhiteSpace() {
        //skip whitespace
        while (this.token.tokenCode == TokenCode.WHITESPACE) {
            this.token = this.nextToken()
        }
    }
    // ---------------------------
    advance(): string {
        if (this.token.tokenCode == TokenCode.EOF) throw ("asked for a token after EOF")
        //set next as current 
        this.token = this.nextToken()
        if (this.autoSkipWhitespaceAndNewLine) this.skipWhiteSpaceAndNewLine()
        return this.token.value
    }

    //--------------------------
    curPosString(): string {
        return this.curReadLine + ':' + this.curReadCol
    }

    //--------------------------
    private consumeStringFromRead(endPos: number): string {
        const result = this.readString.slice(0, endPos)
        this.readString = this.readString.slice(endPos)
        if (this.readString.length < 8 * 1024 && this.file && this.file.isOpen) {
            this.readString += this.file.readChunk()
        }
        return result
    }

    //--------------------------
    /**
     * returns position in this.readString or this.readString.length if not found
     * @param what what to search
     */
    private findRead(what: string): number {
        const foundPos = this.readString.indexOf(what)
        if (foundPos < 0) return this.readString.length
        return foundPos
    }

    //--------------------------
    /**
     * creates a new token from @endPos chars from readLine
     * and also advances curLine and curCol
     * @param type
     * @param endPos
     */
    private createTokenUpToPos(type: TokenCode, endPos: number): Token {
        const result = new Token(this, type, this.consumeStringFromRead(endPos), this.curReadLine, this.curReadCol)
        if (type == TokenCode.NEWLINE) {
            this.curReadLine++
            this.curReadCol = 0
        }
        else if (type == TokenCode.COMMENT) {
            const internalNewLinesCount = result.value.split(/\r\n|\r|\n/).length
            if (internalNewLinesCount) {
                this.curReadLine += internalNewLinesCount-1
                this.curReadCol = 0
            }
        }
        else {
            this.curReadCol += endPos
        }

        //#debug
        if (logger.debugEnabled) logger.debug('>>>READ', `${result.line}:${result.col}`, result.toString())

        return result
    }

    //--------------------------
    private untilNewLine(): number {
        let endPos = this.findRead("\n")
        if (this.readString.charAt(endPos - 1) == '\r') endPos--
        return endPos
    }


    //--------------------------
    private readNewToken(): Token {

        if (this.readString.length == 0) return this.EOFToken

        try {
            const [tokenCode, endPos] = this.recognizeToken()
            return this.createTokenUpToPos(tokenCode, endPos)
        }
        catch (ex) {
            //add current position to error message
            throw new Error(ex.message + `@${this.filename}:${this.curReadLine}:${(this.curReadCol)}`)
        }

    }

    // ---------------------------
    //   function whileUnescaped(chunk:string,endChar:string) returns number
    // ---------------------------
    /**
     *  returns position of unescaped endChar, starting from start
     * @param endChar
     * @param fromPos
     */
    untilUnescaped(endChar: string, fromPos: number) {

        //advance until unescaped endChar
        //return pos of endChar 
        // throws id endChar not found

        //var pos = 0
        let pos = fromPos
        while (true) {

            //find the next quote
            const inx = this.readString.indexOf(endChar, pos)
            //if inx is -1, fail with 'missing closing quote-char: #{endChar} ' // closer not found
            if (inx === -1) { throw new Error(`missing closing quote-char: ${endChar}`) }

            //quote found
            pos = inx

            //check if escaped with '\'
            if (inx > 0 && this.readString.charAt(inx - 1) === '\\') {
                //seems escaped, let's see if the escape is escaped
                let countEscape = 1
                while (inx > countEscape && this.readString.charAt(inx - 1 - countEscape) === '\\') {
                    countEscape++
                }
                //how many escapes?
                if (countEscape % 2 === 0) { //even, means escaped-escapeChar, means: not escaped
                    break //we found the closing quote
                }
                else {
                    //odd number means escaped quote, so it's not the closing quote yet
                    pos = inx + 1
                }
            }
            else {
                //not escaped
                break //we found the closing quote
            }
        }// loop looking for the closing quote

        return pos
    }

    /**
     * Helper functions. simplified regex over this.readString
     * @param rangesStr
     */
    static parseRanges(rangesStr) {

        //Range examples:

        //* "1-9" means all chars between 1 and 9 (inclusive)
        //* "1-9J-Z" means all chars between 1 and 9 or between "J" and "Z"
        //* "1-9JNW" means all chars between 1 and 9, a "J" a "N" or a "W"

        //This function returns a normalized range string without "-"
        //and composed always from ranges:
        //
        //    "1-9" => "19"
        //    "1-9J-Z" => "19JZ"
        //    "1-9JNW" => "19JJNNWW"

        //var result = ""
        let result = ''

        let ch = undefined
        let inx = 0
        while (inx < rangesStr.length) {
            ch = rangesStr.charAt(inx)
            result += ch
            if (rangesStr.charAt(inx + 1) === '-') {
                inx++
                result += rangesStr.charAt(inx + 1)
            }
            else {
                result += ch //same char twice
            }
            inx++
        }

        return result
    }

    whileRanges(rangesStr: string, startPos: number = 0): number {

        //whileRanges, advance while the char is in the ranges specified.
        //will return pos of first char not in range, or entire string if all chars are in ranges
        //e.g.: whileRanges("123ABC","0-9") will return 3:"A"
        //e.g.: whileRanges("123ABC","0-9A-Z") will return 6:{EOS} because all chars are in range

        const len = this.readString.length

        //normalize ranges
        const ranges = Lexer.parseRanges(rangesStr)

        //advance while in any of the ranges
        let inx = startPos
        //do while inx<len
        while (inx < len) {
            const ch = this.readString.charAt(inx)
            let isIn = false
            //check all ranges
            const upTo = ranges.length - 1
            for (let r = 0; r <= upTo; r += 2) {
                if (ch >= ranges.charAt(r) && ch <= ranges.charAt(r + 1)) {
                    isIn = true
                    break
                }
            }

            if (!isIn) { break }
            inx++
        }

        return inx
    }
}





