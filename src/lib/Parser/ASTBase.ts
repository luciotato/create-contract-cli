
//This module defines the base abstract syntax tree node used by the grammar.
//It's main purpose is to provide utility methods used in the grammar
//for **req**uired tokens, **opt**ional tokens
//and comma or semicolon **Separated Lists** of symbols.

import { TokenCode } from '../Lexer/Lexer'
import { ControlledError } from '../util/ControlledError'

import { logger } from '../util/logger'
import { Parser } from './Parser'
import { TypeAnnotation} from './Grammar'
import { EOL } from 'os'

export class ASTBase {

    owner: Parser
    parent: ASTBase
    children: ASTBase[] = []
    keyword: string
    name: string
    typeAnnotation: TypeAnnotation
    //AST node position in source
    sourceLineNum
    sourceColumn
    //wile-parsing info
    locked: boolean
    commentsAndAttr: string[] //comments and #attributes
    attachedComment: string
    //extraInfo // if parse failed, extra information
    extraInfo
    isPublic: boolean = false
    isMut: boolean = false
    isAddressOf: boolean
    nativeSuffixes: ASTBase // to_vec, as_u128, .map, .collect etc.

    constructor(parent, name) {
        this.parent = parent
        this.name = name

        //Get owner from parent
        if (parent) {

            this.owner = parent.owner

            //Remember this node source position.
            //Also remember line index in tokenized lines, and indent
            if (this.owner) {
                //this.sourceLineNum = this.lexer.sourceLineNum
                //this.column = this.lexer.token.column
                //this.indent = this.lexer.indent
                //this.lineInx = this.lexer.lineInx
            }
        }
    }


    // ---------------------------
    lock() {
        //**lock** marks this node as "locked", meaning we are certain this is the right class
        //for the given syntax. For example, if the `FunctionDeclaration` class see the token `function`,
        //we are certain this is the right class to use, so we 'lock()'.
        //Once locked, any **req**uired token not present causes compilation to fail.

        //.locked = true
        this.locked = true
    }
    // ---------------------------
    getParent(searchedClass) {
        //**getParent** method searchs up the AST tree until a specfied node class is found

        //var node = this.parent
        let node = this.parent
        //while node and node isnt instance of searchedClass
        while (node && !(node instanceof searchedClass)) {
            //node = node.parent # move to parent
            node = node.parent
        }// end loop
        //return node
        return node
    }
    // ---------------------------
    positionText() {
        if (!this.owner) { return '(compiler-defined)' }
        return `${this.owner.lexer.filename}:${this.sourceLineNum}:${this.sourceColumn || 0}`
    }
    // ---------------------------
    toString() {
        return `[${this.constructor.name}]` + (this.keyword ? this.keyword + ' ' : '') + this.name
    }
    // ---------------------------
    sayErr(msg) {
        logger.error(this.positionText(), msg)
    }
    // ---------------------------
    warn(msg) {
        logger.warning(this.positionText(), msg)
    }
    // ---------------------------
    throwError(msg) {
        //**throwError** add node position info and throws a 'controlled' error.

        //A 'controlled' error, shows only err.message

        //A 'un-controlled' error is an unhandled exception in the compiler code itself,
        //and it shows error message *and stack trace*.

        logger.throwControlled(`${this.positionText()}. ${msg}`)
    }
    // ---------------------------
    throwParseFailed(msg) {
        //throws a parseFailed-error

        //During a node.parse(), if there is a token mismatch, a "parse failed" is raised.
        //"parse failed" signals a failure to parse the tokens from the stream,
        //however the syntax might still be valid for another AST node.
        //If the AST node was locked-on-target, it is a hard-error.
        //If the AST node was NOT locked, it's a soft-error, and will not abort compilation
        //as the parent node will try other AST classes against the token stream before failing.

        //var cErr = new ControlledError("#{.lexer.posToString()}. #{msg}")
        const cErr = new ControlledError(`${this.owner.lexer.token.posToString()}. ${msg}`)
        cErr.soft = !(this.locked)
        throw cErr
    }
    // ---------------------------
    parse() {
        //abstract method representing the TRY-Parse of the node.
        //Child classes _must_ override this method
        this.throwError('ASTBase parse is abstract')
    }

    // ---------------------------
    /**produce():string is the method to produce target code for this node.
     * derived classes _should_ override this, if the default production isnt: this.name
     * Default behavior is to
     * recursively produce the entire sub-tree to a UTF file
     * 
     */
    produce(): void {
        this.owner.codeWriter.write(this.name)
        this.produceChildren()
    }

    produceChildren(separator?): void {
        const o=this.owner.codeWriter
        let inx=0
        for (const child of this.children) {
            if (inx > 0 && separator) o.write(separator)
            if (separator && separator.includes(EOL)) o.write(' '.repeat(o.indent))
            child.writeComments()
            child.produce()
            inx++
        }
        //if (separator == EOL) o.write(separator)
    }

    /**
     * output all node children as the body of a function
     * indented, one on each line
     * */
    produceBody(indent: number = 4): void {
        const o = this.owner.codeWriter
        o.newLine()
        o.indent += indent
        for (const child of this.children) {
            child.writeComments()
            child.produce()
            o.newLine()
        }
        o.indent -= indent
    }


    writeComments(watchForThis?: string): boolean {
        let result = false;
        if (this.commentsAndAttr && this.commentsAndAttr.length) {
            for (const s of this.commentsAndAttr) {
                if (!s.startsWith("/")) this.owner.codeWriter.write('//')
                if (watchForThis && watchForThis == s) result = true;
                this.owner.codeWriter.writeLine(s)
            }
        }
        return result;
    }

    //--- helper
    tokVal(): string {
        return this.owner.lexer.token.value
    }

    // ---------------------------
    //parseDirect(key, directMap) {

    //    //We use a DIRECT associative array to pick the exact AST node to parse
    //    //based on the actual token value or type.
    //    //This speeds up parsing, avoiding parsing by trial & error

    //    //Check keyword

    //    //if directMap.get(key) into var param
    //    let param = directMap[key]
    //    if (param) {
    //        //try parse by calling .opt
    //        let statement = undefined
    //        if (param instanceof Array) {
    //            //#accept Arrays also
    //            statement = this.optList(param)
    //        }
    //        else {
    //            //#normal call
    //            statement = this.optList([param])
    //        }
    //        //return parsed statement or nothing
    //        return statement
    //    }
    //}

    // ---------------------------
    optList(list: (string | number | typeof ASTBase)[]): string | ASTBase {
        //**opt** (optional) parses optional parts of a grammar. It attempts to parse
        //the token stream using one of the classes or token types specified.
        //This method takes a variable number of arguments.
        //For example:
        //calling `.opt IfStatement, Expression, 'IDENTIFIER'`
        //would attempt to parse the token stream first as an `IfStatement`. If that fails, it would attempt
        //to use the `Expression` class. If that fails, it will accept a token of type `IDENTIFIER`.
        //If all of those fail, it will return `undefined`.

        //Method start:

        const t = this.owner.lexer.token
        //For each argument, -a class or a string-, we will attempt to parse the token stream
        //with the class, or match the token type to the string.

        //for each searched in arguments.toArray()
        for (const searched of list) {

            //skip empty, null & undefined
            if (!searched) { continue }

            let found: boolean = false

            //For strings, we check the token **value** 
            if (typeof searched === 'string') {
                const searchedString: string = searched
                found = (t.value == searchedString)
                if (found && logger.debugEnabled) {
                    logger.debug(this.constructor.name, 'matched OK:', searched, t.value)
                }
            }

            //For numbers, we assume it's a TokenCode
            else if (typeof searched === 'number') { //it's a TokenCode
                const searchedToken: TokenCode = searched as TokenCode
                found = (t.tokenCode == searchedToken)
                if (found && logger.debugEnabled) {
                    logger.debug(this.constructor.name, 'matched OK:', TokenCode[searchedToken], t.value)
                }
            }

            if (found) { //simple string/Token match
                //Ok, type/value found! now we return: token.value
                //Note: we shouldn't return the 'token' object, because returning objects (here and in js)
                //is "pass-by-reference" for the object members. You return a "pointer" to the object.
                //If we return the 'token' object, the calling function will recive a "pointer"
                //and it can inadvertedly alter the token object members in the token stream. (it should not, leads to subtle bugs)

                //Consume this token
                this.owner.lexer.advance()
                //discard saved position
                this.owner.lexer.discardSavedPosition()
                //return token value
                return t.value
            }

            else if (typeof searched === 'function') { //it's a Grammar class

                const searchedClass = searched as (typeof ASTBase)

                logger.debug(this.constructor.name, 'TRY', searchedClass.name, 'on', t.toString())

                //if the argument is an AST node class, we instantiate the class and try the `parse()` method.
                //`parse()` can throw `ParseFailed` if the syntax do not matches the parse

                //Remember the actual position, to rewind if parse soft-fails
                this.owner.lexer.savePosition()

                try {

                    //create required ASTNode, to try method parse()
                    const astNode = new searchedClass(this, t.value)
                    astNode.sourceLineNum = t.line
                    astNode.sourceColumn = t.col

                    //if it can't parse, will raise an exception
                    astNode.parse()

                    //logger.debug spaces, 'Parsed OK!->',searched.name
                    logger.debug('Parsed OK!->', searchedClass.name)

                    //discard saved position
                    this.owner.lexer.discardSavedPosition()
                    //parsed ok!, return instance
                    return astNode

                }
                catch (err) {

                    if (!(err instanceof ControlledError)) { //non-controlled error
                        //discard saved position
                        this.owner.lexer.discardSavedPosition()
                        throw err
                    }

                    //If parsing fail, but the AST node was not 'locked' on target, (that is, if it was a "soft" exception),
                    //we try other AST nodes.

                    //if err.soft => no match, try next
                    if (err.soft) {
                        this.owner.lexer.softError = err
                        logger.debug(searchedClass.name, 'parse failed.', err.message)
                        //rewind the token stream, to try other AST nodes
                        this.owner.lexer.restoreSavedPosition()
                        logger.debug('<<REW to', this.owner.lexer.token.toStringDebug())
                    }
                    else {
                        //else: it's a hard-error. The AST node were locked-on-target.
                        //We abort parsing and throw.

                        //discard saved position
                        this.owner.lexer.discardSavedPosition()

                        //# the first hard-error is the most informative, the others are cascading ones
                        //if .lexer.hardError is null, .lexer.hardError = err
                        if (this.owner.hardError === null) { this.owner.hardError = err }

                        //raise up, abort parsing
                        throw err
                    } //end if - type of error

                }//end catch

            }//end if - string/TokenCode/ASTclass

        }//end loop - try the next argument

        //No more arguments.
        //`opt` returns `undefined` if none of the arguments can be use to parse the token stream.
        return undefined
    }

    // ---------------------------
    opt(singleItem: string | typeof ASTBase): string | ASTBase {
        return this.optList([singleItem])
    }

    // ---------------------------
    /**
     * Require one of a list
     * 
     * @param list to try parsing, in order, one of the list must parse
     */
    reqList(list: (string | number | typeof ASTBase)[]): string | ASTBase {

        //**req** (required) try to parse *required* symbols of the grammar.
        //It works the same way as `opt` except that it throws an error if none of the arguments
        //can be used to parse the stream.

        //We first call `opt` to try the arguments in order.
        //If a value is returned, the parsing was successful,
        //so we just return the node that `opt` found.
        const result = this.optList(list)

        //If `opt` returned "undefined" (no match), we give the user a useful error message.
        if (!result) {
            this.throwParseFailed(`${this.constructor.name}:${this.extraInfo || ''} found ${this.owner.lexer.token.toString()} but ${ASTBase.listToString(list)} required`)
        }
        return result
    }

    // ---------------------------
    req(item: string): string {
        return this.reqList([item]) as string
    }
    // ---------------------------
    reqClass(ASTClass: typeof ASTBase): ASTBase {
        return this.reqList([ASTClass]) as ASTBase
    }
    // ---------------------------
    reqChild(ASTClass: typeof ASTBase): void {
        this.children.push(this.reqList([ASTClass]) as ASTBase)
    }
    optChild(ASTClass: typeof ASTBase): void {
        const result = this.opt(ASTClass) as ASTBase
        if (result) {
            this.children.push(result)
        }
    }
    // ---------------------------
    reqToken(tokenCode: TokenCode): string {
        return this.reqList([tokenCode]) as string
    }

    // ---------------------------
    reqOneOf(list: string[]): string {
        //(performance) check before try to parse, that the next token is in the list
        //if .lexer.token.value in arr
        if (list.includes(this.owner.lexer.token.value)) {
            return this.reqList(list) as string
        }
        else {
            this.throwParseFailed('not in list')
        }
    }

    /**
     * a [separator] separated list of [astClass] ended by [closer] 
     * 
     * the last closer is consumed
     * 
     * @param astClass
     * @param separator
     * @param closer
     */
    // ---------------------------
    optSeparatedList(astClass: typeof ASTBase, separator: string, closer: string): ASTBase[] {

        //Start optSeparatedList
        //normal separated list,
        //loop until closer found

        const result: ASTBase[] = []

        logger.debug(`optSeparatedList [${this.constructor.name}] get SeparatedList of [${astClass.name}] by '${separator}' closer:`, closer || '-no closer-')

        const startLine = this.owner.lexer.token.line

        while (true) {
            if (this.owner.lexer.token.tokenCode == TokenCode.EOF) break //break on EOF
            if (closer && this.opt(closer)) break //if closer set, and closer found, break

            //pre comments and attrs
            const preComments: string[] = []
            this.owner.lexer.consumeCommentsAndAttr(preComments)

            //get an item
            const item = this.reqClass(astClass) as ASTBase
            this.lock()

            //add item to result
            result.push(item)

            item.commentsAndAttr = preComments
            //post comments and attr - NO, se come pre comments del siguiente
            //this.owner.tokenizer.consumeCommentsAndAttr(item.commentsAndAttr )

            //if .opt(closer) then break #closer found
            if (this.opt(closer)) { break }

            //here, a 'separator' (comma/semicolon) means: 'there is another item'.
            //Any token other than 'separator' means 'end of list'

            //if no .opt(separator)
            if (!this.opt(separator)) {
                //# any token other than comma/semicolon means 'end of comma separated list'
                //# but if a closer was required, then "other" token is an error
                //if closer, .throwError "Expected '#{closer}' to end list started at line #{startLine}, got '#{.lexer.token.value}'"
                if (closer) { this.throwError(`Expected '${closer}' to end list started at line ${startLine}, got '${this.owner.lexer.token.value}'`) }
                break
            }

        }// try another item after the separator

        if (closer == '}') this.owner.lexer.semiNotRequired = true //semicolon not required if list closed by '}'

        return result
    }

    // ---------------------------
    reqSeparatedList(astClass: typeof ASTBase, separator: string, closer: string): ASTBase[] {
        //**reqSeparatedList** is the same as `optSeparatedList` except that it throws an error
        //if the list is empty

        //First, call optSeparatedList
        const result = this.optSeparatedList(astClass, separator, closer)
        if (result.length === 0) { this.throwParseFailed(`${this.constructor.name}: Get list: At least one [${astClass.name}] was expected`) }

        return result
    }

    //------------------------
    optPub() {
        //manage special prefixes like 'pub'
        if (this.owner.lexer.token.value == 'pub') {
            this.isPublic = true
            this.owner.lexer.advance()
        }
    }
    optAddrOf() {
        //manage special prefixes like '&'
        if (this.owner.lexer.token.value == '&') {
            this.isAddressOf = true
            this.owner.lexer.advance()
        }
    }
    optMut() {
        //manage special prefixes like 'mut'
        if (this.owner.lexer.token.value == 'mut') {
            this.isMut = true
            this.owner.lexer.advance()
        }
    }


    // ---------------------------
    /**
     * Helper function toString of an argument list to opt() or req()
     * @param args
     */
    static listToString(args: (string | number | typeof ASTBase)[]) {
        //listArgs list arguments (from opt or req). used for debugging
        //and syntax error reporting

        //var msg = []
        const msg = []
        //for each i in args
        for (const i of args) {

            //if typeof i is 'string'
            if (typeof i === 'string') {
                msg.push(`'${i}'`)
            }

            else if (i) {

                if (typeof i === 'function') {
                    msg.push(`[${i.name}]`)
                }
                else if (typeof i === 'number') {
                    msg.push(`[${TokenCode[i]}]`)
                }
                else {
                    msg.push(`<${i["name"]}>`)
                }
            }

            else {
                msg.push('[null]')
            }
        }
        return msg.join('|')
    }

    // ---------------------------
    /*
    out(list: (string | object | ASTBase)[]) {

        //*out* is a helper function for code generation
        //It evaluates and output its arguments. uses .lexer.out

        var rawOut = .lexer.outCode
        const rawOut = this.owner.outCode

        //for each item in arguments.toArray()
        for (const item of list) {

            //skip empty items
            //if no item, continue
            if (!item) { continue }

            //if it is the first thing in the line, out indentation

            //if rawOut.currLine.length is 0  and .indent > 0
            //if (rawOut.currLine.length === 0 && this.indent > 0) {
            //    //rawOut.put String.spaces(.indent)
            //    rawOut.put(' '.repeat(this.indent))
            //}

            //if it is an AST node, call .produce()

            //if item instance of ASTBase
            if (item instanceof ASTBase) {
                item.produce()
            }

            else if (item === '\n') {
                rawOut.startNewLine()
            }

            else if (typeof item === 'string') {
                rawOut.put(item)
            }
            else if (item instanceof Array) {

                //# Recursive #
                this.out(item)
            }

            else if (item instanceof Object) {

                // expected keys:
                //  COMMENT:string, NLI, CSL:Object array, freeForm, h

                //{CSL:arr} -> output the array as Comma Separated List (note: CSL can be present and undefined)

                //if item.hasProperty('CSL')
                let comment = undefined
                //var header = undefined
                if ("CSL" in item) {
                    const CSL = item["CSL"]
                    // additional keys: pre,post,separator
                    const separator = item['separator'] || ', '
                    //var freeFormMode = item.tryGetProperty('freeForm')
                    const newLineIncluded = false
                    //var actualIndent = rawOut.getIndent()

                    //for each inx,listItem in CSL
                    let inx = 0;
                    for (const listItem in CSL as object) {
                        if (inx > 0) {
                            rawOut.put(separator)
                        }
                        inx++
                        //#recurse
                        this.out([item['pre'], listItem, item['post']])
                    }

                    //if newLineIncluded # prettier generated code
                    if (newLineIncluded) {
                        //rawOut.startNewLine
                        rawOut.startNewLine()
                    }
                }

                else if ((comment = item['COMMENT']) != undefined) {
                    //# prepend // if necessary
                    if (typeof item !== 'string' || !(comment.startsWith('//'))) { rawOut.put('// ') }
                    this.out(comment)
                }

                else {
                    this.sayErr(`ASTBase method out Map|Object: unrecognized keys: ${item}`)
                }
            }

            else {
                rawOut.put(item as string)
            }

        }//end loop, next item


    }

    /*
    // ---------------------------
    outPreviousComments = function () {

        //out previous lines with comments

        //if no .sourceLineNum, return // if undefined or 0
        if (!this.sourceLineNum) { return }

        //search CODE line, immediatly previous to this
        //var prevCODElineInx = .lexer.getPrevCODEInfoLineIndex(.sourceLineNum)
        var prevCODElineInx = this.lexer.getPrevCODEInfoLineIndex(this.sourceLineNum)

        //search line previous to this (any type)
        //var endAtInx = .lexer.getInfoLineIndex(.sourceLineNum-1)
        var endAtInx = this.lexer.getInfoLineIndex(this.sourceLineNum - 1)

        // print in-between lines (comments & blank lines)
        //for lineInx=prevCODElineInx+1 to endAtInx
        var _end1 = endAtInx
        for (var lineInx = prevCODElineInx + 1; lineInx <= _end1; lineInx++) {
            //.outInfoLineAsComment lineInx
            this.outInfoLineAsComment(lineInx)
        }// end for lineInx

    }
    // ---------------------------
    outSourceLinesAsComment = function (upTo, fromLineNum) {

        //if no .lexer.options.comments, return
        if (!this.lexer.options.comments) { return }

        //default fromLineNum = .sourceLineNum // this statement
        if (fromLineNum === undefined) fromLineNum = this.sourceLineNum
        //default upTo = .sourceLineNum // this statement
        if (upTo === undefined) upTo = this.sourceLineNum

        //var startAtInx = .lexer.getInfoLineIndex(fromLineNum)
        var startAtInx = this.lexer.getInfoLineIndex(fromLineNum)
        //var endAtInx = .lexer.getInfoLineIndex(upTo)
        var endAtInx = this.lexer.getInfoLineIndex(upTo)

        //for lineInx=startAtInx to endAtInx
        var _end2 = endAtInx
        for (var lineInx = startAtInx; lineInx <= _end2; lineInx++) {
            //.outInfoLineAsComment lineInx
            this.outInfoLineAsComment(lineInx)
        }// end for lineInx

    }
    // ---------------------------

    levelIndent() {
        //show indented messaged for debugging

        //var indent = 0
        var indent = 0
        //var node = this
        var node = this.parent
        //while node.parent into node
        while (node) {
            //indent += 2 //add 2 spaces
            indent += 2
            node = node.parent
        }// end loop

        //return String.spaces(indent)
        return ' '.repeat(indent)
    }
    */

}

