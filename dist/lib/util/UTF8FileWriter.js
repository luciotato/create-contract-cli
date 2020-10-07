// --------------------
// UTF8FileReader
// --------------------
import * as fs from 'fs';
export class UTF8FileWriter {
    constructor() {
        this.isOpen = false;
        this.indent = 0;
    }
    /**
     * open the file | throw
     * @param filename
     */
    open(filename) {
        try {
            this.fd = fs.openSync(filename, 'w');
        }
        catch (e) {
            throw new Error("opening " + filename + ", error:" + e.toString());
        }
        this.filename = filename;
        this.isOpen = true;
    }
    /**
     * write text to the file
     * (or throw)
     * */
    write(s) {
        if (!this.isOpen) {
            throw new Error(this.filename + " is closed.");
        }
        try {
            fs.writeSync(this.fd, s);
        }
        catch (e) {
            throw new Error("writing to " + this.filename + ", error:" + e.toString());
        }
    }
    writeLine(s) {
        this.write(' '.repeat(this.indent) + s + '\n');
    }
    close() {
        if (!this.isOpen) {
            return;
        }
        fs.closeSync(this.fd);
        this.isOpen = false;
    }
}
//# sourceMappingURL=UTF8FileWriter.js.map