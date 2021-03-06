"use strict";
// public helper class CodeWriter
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeWriter = void 0;
const fs = require("fs");
const mkPath = require("../util/mkPath");
const console_1 = require("console");
const os_1 = require("os");
class CodeWriter {
    // ---------------------------
    constructor(fn1, data, fn2 = '', fn3 = '') {
        this.fileMode = true;
        this.filenames = ['', '', ''];
        this.fileIsOpen = [false, false, false];
        this.fHandles = [null, null, null];
        this.selectedStream = 0;
        this.indent = 0;
        this.filenames = [fn1, fn2, fn3];
        this.data = data;
        // Initialize output array
        this.lineNum = 1;
        this.column = 1;
        this.currLine = [];
        this.lines = [[], [], []];
    }
    // ---------------------------
    selectOutStream(index) {
        this.newLine();
        this.selectedStream = index;
    }
    // ---------------------------
    write(text) {
        // put a string into produced code
        if (text) {
            this.currLine.push(text);
            this.column += text.length;
        }
    }
    // ---------------------------
    writeLine(text) {
        this.write(text);
        this.newLine();
    }
    // ---------------------------
    getIndent() {
        // if no .currLine.length, return 0
        if (!this.currLine.length) {
            return 0;
        }
        return this.currLine[0].countSpaces();
    }
    // ---------------------------
    newLine() {
        // Start New Line into produced code
        // send the current line
        if (this.currLine.length) {
            if (this.fileMode) {
                if (!this.fileIsOpen[this.selectedStream]) {
                    // make sure output dir exists
                    const filename = this.filenames[this.selectedStream];
                    console_1.assert(filename);
                    mkPath.toFile(filename);
                    // open output file
                    this.fHandles[this.selectedStream] = fs.openSync(filename, 'w');
                    this.fileIsOpen[this.selectedStream] = true;
                }
                const fd = this.fHandles[this.selectedStream];
                // save all the parts to file
                if (this.indent > 0)
                    fs.writeSync(fd, ' '.repeat(this.indent));
                // for each part in .currLine
                for (const part of this.currLine) {
                    fs.writeSync(fd, part);
                }
                // close the line: "\n"
                fs.writeSync(fd, os_1.EOL);
            }
            else {
                // not fileMode
                // store in array
                this.lines[this.selectedStream].push(this.currLine.join(''));
            }
            if (this.selectedStream === 0) {
                this.lineNum++;
            }
        }
        this.clearCurrentLine();
    }
    // ----------------------------
    // clear current working line
    clearCurrentLine() {
        // clear current line
        this.currLine = [];
        this.column = 1;
    }
    // ----------------------------
    // return current working line
    getCurrentLine() {
        return this.currLine.join("");
    }
    // ---------------------------
    ensureNewLine() {
        // if there's something on the line, start a new one
        if (this.currLine.length) {
            this.newLine();
        }
    }
    // ---------------------------
    blankLine() {
        this.newLine();
        this.currLine.push('');
        this.newLine();
    }
    // ---------------------------
    getResult(inx = 0) {
        // get result and clear memory
        if (inx === undefined)
            inx = 0;
        this.selectedStream = inx;
        // #close last line
        this.newLine();
        return this.lines[inx];
    }
    // ---------------------------
    close() {
        // save last pending line
        this.newLine();
        if (this.fileMode) {
            for (let inx = 0; inx <= 2; inx++) {
                if (this.fileIsOpen[inx]) {
                    fs.closeSync(this.fHandles[inx]);
                    this.fileIsOpen[inx] = false;
                }
            }
        }
    }
}
exports.CodeWriter = CodeWriter;
//# sourceMappingURL=CodeWriter.js.map