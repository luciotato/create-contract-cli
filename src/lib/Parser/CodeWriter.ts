//public helper class CodeWriter

import * as fs from 'fs'
import * as mkPath from '../util/mkPath'
import { assert } from 'console'
import { EOL } from 'os'

export class CodeWriter {

    lineNum: number
    column: number
    currLine: string[]

    fileMode = true
    filenames = ['', '', '']
    fileIsOpen = [false, false, false]
    fHandles = [null, null, null]
    selectedStream: number = 0

    indent: number =0

    lines
    browser: boolean
    exportNamespace: boolean
    public data: any
    
    // ---------------------------
    constructor(fn1: string, data: any, fn2: string = '', fn3: string = '') {
        this.filenames = [fn1, fn2, fn3]
        this.data = data
        //Initialize output array
        this.lineNum = 1
        this.column = 1
        this.currLine = []
        this.lines = [[], [], []]
    }

    // ---------------------------
    selectOutStream (index: 0|1|2) {
        this.newLine()
        this.selectedStream= index
    }

    // ---------------------------
    write (text: string) {
        //put a string into produced code
        if (text) {
            this.currLine.push(text)
            this.column += text.length
        }
    }

    // ---------------------------
    writeLine(text: string) {
        this.write(text)
        this.newLine()
    }

    // ---------------------------
    getIndent () {
        //if no .currLine.length, return 0
        if (!this.currLine.length) { return 0 }
        return this.currLine[0].countSpaces()
    }

    // ---------------------------
    newLine () {
        //Start New Line into produced code
        //send the current line
        if (this.currLine.length) {
            if (this.fileMode) {
                if (!this.fileIsOpen[this.selectedStream]) {
                    // make sure output dir exists
                    const filename = this.filenames[this.selectedStream]
                    assert(filename)
                    mkPath.toFile(filename)
                    //open output file
                    this.fHandles[this.selectedStream] = fs.openSync(filename, 'w')
                    this.fileIsOpen[this.selectedStream] = true
                }

                const fd = this.fHandles[this.selectedStream]
                //save all the parts to file
                if (this.indent > 0) fs.writeSync(fd, ' '.repeat(this.indent))
                //for each part in .currLine
                for (const part of this.currLine) {
                    fs.writeSync(fd, part)
                }
                //close the line: "\n"
                fs.writeSync(fd, EOL)
            }
            else {
                //not fileMode
                //store in array
                this.lines[this.selectedStream].push(this.currLine.join(''))
            }

            if (this.selectedStream=== 0) {
                this.lineNum++
            }

        }

        this.clearCurrentLine()
    }

    //----------------------------
    // clear current working line
    clearCurrentLine() {
        //clear current line
        this.currLine = []
        this.column = 1
    }
    //----------------------------
    // return current working line
    getCurrentLine() {
        return this.currLine.join("")
    }

    // ---------------------------
    ensureNewLine () {
        //if there's something on the line, start a new one
        if (this.currLine.length) { this.newLine() }
    }

    // ---------------------------
    blankLine () {
        this.newLine()
        this.currLine.push('')
        this.newLine()
    }

    // ---------------------------
    getResult (inx: 0|1|2 = 0) {
        //get result and clear memory

        if (inx === undefined) inx = 0

        this.selectedStream= inx
        //#close last line
        this.newLine()
        return this.lines[inx]
    }

    // ---------------------------
    close () {

        //save last pending line
        this.newLine()

        if (this.fileMode) {
            for (let inx = 0; inx <= 2; inx++) {
                if (this.fileIsOpen[inx]) {
                    fs.closeSync(this.fHandles[inx])
                    this.fileIsOpen[inx] = false
                }
            }

        }
    }

}
