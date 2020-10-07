// Generated by LiteScript compiler v0.8.9, source: lib/mkPath.lite.md
// -----------
// Module Init
// -----------
//= ============

// import fs, path
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------
// mkPath.toFile
// ---------------------------
export function toFile(filename: string) :void{
    // Create a path to a file
    create(path.dirname(filename))
}

// ---------------------------
// mkPath.create(dirPath)
// ---------------------------
export function create(dirPath:string) :void {
    // Make sure a path exists - Recursive

    if (dirExists(dirPath)) { return } // ok! dir exists

    // else... recursive:
    // try a folder up, until a dir is found (or an error thrown)
    create(path.dirname(dirPath)) // recurse

    // ok, found parent dir! - make the children dir
    fs.mkdirSync(dirPath)

    // return into recursion, creating children subdirs in reverse order (of recursion)
}

//    helper function dirExists(dirPath)
// ---------------------------
export function dirExists(dirPath:string): boolean {
    try {
        if (fs.statSync(dirPath).isDirectory()) {
            return true // ok! exists and is a directory
        } else {
            throw new Error(`${dirPath} exists but IT IS NOT a directory`)
        }
    } catch (err) {
        // if dir does not exists, return false
        if (err.code === 'ENOENT') { return false }
        throw err // another error
    }
}
