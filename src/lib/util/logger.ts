import * as color from './color.js'
import { ControlledError } from './ControlledError.js'

// Main namespace
/* eslint no-inner-declarations: "off" */

// errorCount = 0
// warningCount = 0

// if storeMessages, messages are pushed at messages[] instead of console.

// storeMessages: boolean
// messages: string Array = []

// Implementation
// ---------------

//     properties

// errorCount = 0
// warningCount = 0

// if storeMessages, messages are pushed at messages[] instead of console.

export let storeMessages: boolean
export const verboseLevel = 1
export let errorCount = 0
export const warningLevel = 0
export let warningCount = 0
export let messages = []


export let debugLevel = 0
export let debugFrom = 0
export function setDebugLevel(level:number, fromLine?:number): void {
    debugLevel = level
    debugFrom = fromLine || 0
}

//     method debug
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debug(...args: any[]): void {
    if (debugLevel) {
        console.error(...args)
    }
}

//     method debugGroup
// ---------------------------
export function debugGroup(...args:string[]) : void{
    if (debugLevel) {
        console.error(...args)
        console.group(...args)
    }
}

//     method debugGroupEnd
// ---------------------------
export function debugGroupEnd():void {
    if (debugLevel) {
        console.groupEnd()
    }
}

//     method error
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function error(...args: any[]):void {
    errorCount++
    // add "ERROR:", send to debug logger
    args.unshift('ERROR:')
    debug(...args)

    // if messages should be stored...
    if (storeMessages) {
        messages.push(args.join(' '))
    } else {
        args.unshift(color.red)
        args.push(color.normal)
        console.error.apply(args.join(' '))
    }
}

//     method warning
// ---------------------------
export function warning(...args: string[]): void {
    warningCount++

    args.unshift('WARNING:')
    debug(...args)

    if (warningLevel > 0) {
        // if messages should be stored...
        if (storeMessages) {
            messages.push(args.join(' '))
        } else {
            args.unshift(color.yellow)
            args.push(color.normal)
            console.error(args.join(' '))
        }
    }
}

//     method msg
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function msg(...args: any[]):void {
    debug(...args)
    if (verboseLevel >= 1) {
        // if messages should be stored...
        if (storeMessages) {
            messages.push(args.join(' '))
        } else {
            console.log(...args)
        }
    }
}

//     method info
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function info(...args:any[]):void {
    if (verboseLevel >= 2) {
        // msg.apply(undefined,args)
        msg(...args)
    }
}

//     method extra
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extra(...args:any[]):void {
    if (verboseLevel >= 3) {
        msg(...args)
    }
}

//     method getMessages
// ---------------------------
export function getMessages():string[] {
    // get & clear
    const result = messages
    messages = []
    return result
}

//     method throwControlled(msg)
// ---------------------------
export function throwControlled(errorMsg: string):void {
    // Throws Error, but with a "controlled" flag set,
    // to differentiate from unexpected compiler errors

    debug('Controlled ERROR:', errorMsg)
    throw new ControlledError(errorMsg)
}

