//--------------------
// UTF8FileReader
//--------------------
import * as fs from 'fs';
import { StringDecoder} from "string_decoder";

export class UTF8FileReader {

    filename: string;
    isOpen: boolean = false;
    private chunkSize: number;
    private fd: number; //file handle from fs.OpenFileSync
    private readFilePos: number;
    private readBuffer: Buffer;

    private utf8decoder: StringDecoder

    /**
     * open the file | throw
     * @param filename
     */
    open(filename, chunkSize: number = 16 * 1024) {

        this.chunkSize = chunkSize;

        try {
            this.fd = fs.openSync(filename, 'r');
        }
        catch (e) {
            throw new Error("opening " + filename + ", error:" + e.toString());
        }

        this.filename = filename;
        this.isOpen = true;

        this.readBuffer = Buffer.alloc(this.chunkSize);
        this.readFilePos = 0;

        //a StringDecoder is a buffered object that ensures complete UTF-8 multibyte decoding from a byte buffer
        this.utf8decoder = new StringDecoder('utf8')

    }

    /**
     * read another chunk from the file 
     * return the decoded UTF8 into a string
     * (or throw)
     * */
    readChunk(): string {

        let decodedString = '' //return '' by default

        if (!this.isOpen) {
            return decodedString;
        }

        let readByteCount: number;
        try {
            readByteCount = fs.readSync(this.fd, this.readBuffer, 0, this.chunkSize, this.readFilePos);
        }
        catch (e) {
            throw new Error("reading " + this.filename + ", error:" + e.toString());
        }

        if (readByteCount) {
            //some data read, advance readFilePos 
            this.readFilePos += readByteCount;
            //get only the read bytes (if we reached the end of the file)
            const onlyReadBytesBuf = this.readBuffer.slice(0, readByteCount);
            //correctly decode as utf8, and store in decodedString
            //yes, the api is called "write", but it decodes a string - it's a write-decode-and-return the string kind-of-thing :)
            decodedString = this.utf8decoder.write(onlyReadBytesBuf); 
        }
        else {
            //read returns 0 => all bytes read
            this.close();
        }
        return decodedString 
    }

    close() {
        if (!this.isOpen) {
            return;
        }
        fs.closeSync(this.fd);
        this.isOpen = false;
        this.utf8decoder.end();
    }

}
