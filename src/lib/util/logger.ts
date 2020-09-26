import { color } from './color.js'
import { ControlledError } from './ControlledError.js'

//Main namespace
/*eslint no-inner-declarations: "off"*/
export namespace logger {

    //errorCount = 0
    //warningCount = 0

    //if storeMessages, messages are pushed at messages[] instead of console.

    //storeMessages: boolean
    //messages: string Array = []

    //Implementation
    //---------------

    //     properties

    //errorCount = 0
    //warningCount = 0

    //if storeMessages, messages are pushed at messages[] instead of console.

    export var storeMessages: boolean
    export var verboseLevel = 1
    export var errorCount = 0
    export var warningLevel= 0
    export var warningCount = 0
    export var messages = []
    export var debugEnabled = false
    export var verboseLevel = 1
    //     method debug
    // ---------------------------
    // eslint-disable-next-line no-shadow-restricted-names
    export function debug(...vargs: any[]) {

        //if options.debugEnabled
        if (debugEnabled) {

            //var args = arguments.toArray()
            var args = Array.prototype.slice.call(vargs)
            //console.error.apply undefined,args
            console.error.apply(undefined, args)
        }
    }

    //     method debugGroup
    // ---------------------------
    export function debugGroup() {

        //if options.debugEnabled
        if (debugEnabled) {

            //console.error.apply undefined,arguments
            console.error.apply(undefined, Array.prototype.slice.call(arguments))
            //console.group.apply undefined,arguments
            console.group.apply(undefined, Array.prototype.slice.call(arguments))
        }
    }

    //     method debugGroupEnd
    // ---------------------------
    export function debugGroupEnd() {

        //if options.debugEnabled
        if (debugEnabled) {

            //console.groupEnd
            console.groupEnd()
        }
    }

    //     method error
    // ---------------------------
    export function error(...vargs: any[]) {

        errorCount++
        var args = Array.prototype.slice.call(vargs)

        //add "ERROR:", send to debug logger
        args.unshift('ERROR:')
        debug.apply(undefined, args)

        //if messages should be stored...
        if (storeMessages) {
            messages.push(args.join(' '))
        }
        else {
            args.unshift(color.red)
            args.push(color.normal)
            console.error.apply(undefined, args)
        }
    }


    //     method warning
    // ---------------------------
    export function warning(...vargs: string[]) {

        warningCount++
        var args = Array.prototype.slice.call(vargs)

        args.unshift('WARNING:')
        debug.apply(undefined, args)

        if (warningLevel > 0) {

            //if messages should be stored...
            if (storeMessages) {
                messages.push(args.join(' '))
            }
            else {
                args.unshift(color.yellow)
                args.push(color.normal)
                console.error.apply(undefined, args)
            }
        }
    }

    //     method msg
    // ---------------------------
    export function msg(...vargs: string[]) {

        var args = Array.prototype.slice.call(vargs)
        debug.apply(undefined, args)
        if (verboseLevel >= 1) {

            //if messages should be stored...
            if (storeMessages) {
                messages.push(args.join(' '))
            }
            else {
                console.log.apply(undefined, args)
            }
        }
    }


    //     method info
    // ---------------------------
    export function info() {

        var args = Array.prototype.slice.call(arguments)
        if (verboseLevel >= 2) {

            //msg.apply(undefined,args)
            msg.apply(undefined, args)
        }
    }

    //     method extra
    // ---------------------------
    export function extra() {

        var args = Array.prototype.slice.call(arguments)
        if (verboseLevel >= 3) {
            msg.apply(undefined, args)
        }
    }


    //     method getMessages
    // ---------------------------
    export function getMessages() {
        //get & clear
        var result = messages
        messages = []
        return result
    }


    //     method throwControlled(msg)
    // ---------------------------
    export function throwControlled(errorMsg: string) {

        //Throws Error, but with a "controlled" flag set,
        //to differentiate from unexpected compiler errors

        debug('Controlled ERROR:', errorMsg)
        throw new ControlledError(errorMsg)
    }

}
