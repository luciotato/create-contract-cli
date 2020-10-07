"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwControlled = exports.getMessages = exports.extra = exports.info = exports.msg = exports.warning = exports.error = exports.debugGroupEnd = exports.debugGroup = exports.debug = exports.setDebugLevel = exports.debugFrom = exports.debugLevel = exports.messages = exports.warningCount = exports.warningLevel = exports.errorCount = exports.verboseLevel = exports.storeMessages = void 0;
const color = require("./color.js");
const ControlledError_js_1 = require("./ControlledError.js");
exports.verboseLevel = 1;
exports.errorCount = 0;
exports.warningLevel = 0;
exports.warningCount = 0;
exports.messages = [];
exports.debugLevel = 0;
exports.debugFrom = 0;
function setDebugLevel(level, fromLine) {
    exports.debugLevel = level;
    exports.debugFrom = fromLine || 0;
}
exports.setDebugLevel = setDebugLevel;
//     method debug
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debug(...args) {
    if (exports.debugLevel) {
        console.error(...args);
    }
}
exports.debug = debug;
//     method debugGroup
// ---------------------------
function debugGroup(...args) {
    if (exports.debugLevel) {
        console.error(...args);
        console.group(...args);
    }
}
exports.debugGroup = debugGroup;
//     method debugGroupEnd
// ---------------------------
function debugGroupEnd() {
    if (exports.debugLevel) {
        console.groupEnd();
    }
}
exports.debugGroupEnd = debugGroupEnd;
//     method error
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function error(...args) {
    exports.errorCount++;
    // add "ERROR:", send to debug logger
    args.unshift('ERROR:');
    debug(...args);
    // if messages should be stored...
    if (exports.storeMessages) {
        exports.messages.push(args.join(' '));
    }
    else {
        args.unshift(color.red);
        args.push(color.normal);
        console.error.apply(args.join(' '));
    }
}
exports.error = error;
//     method warning
// ---------------------------
function warning(...args) {
    exports.warningCount++;
    args.unshift('WARNING:');
    debug(...args);
    if (exports.warningLevel > 0) {
        // if messages should be stored...
        if (exports.storeMessages) {
            exports.messages.push(args.join(' '));
        }
        else {
            args.unshift(color.yellow);
            args.push(color.normal);
            console.error(args.join(' '));
        }
    }
}
exports.warning = warning;
//     method msg
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function msg(...args) {
    debug(...args);
    if (exports.verboseLevel >= 1) {
        // if messages should be stored...
        if (exports.storeMessages) {
            exports.messages.push(args.join(' '));
        }
        else {
            console.log(...args);
        }
    }
}
exports.msg = msg;
//     method info
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function info(...args) {
    if (exports.verboseLevel >= 2) {
        // msg.apply(undefined,args)
        msg(...args);
    }
}
exports.info = info;
//     method extra
// ---------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extra(...args) {
    if (exports.verboseLevel >= 3) {
        msg(...args);
    }
}
exports.extra = extra;
//     method getMessages
// ---------------------------
function getMessages() {
    // get & clear
    const result = exports.messages;
    exports.messages = [];
    return result;
}
exports.getMessages = getMessages;
//     method throwControlled(msg)
// ---------------------------
function throwControlled(errorMsg) {
    // Throws Error, but with a "controlled" flag set,
    // to differentiate from unexpected compiler errors
    debug('Controlled ERROR:', errorMsg);
    throw new ControlledError_js_1.ControlledError(errorMsg);
}
exports.throwControlled = throwControlled;
//# sourceMappingURL=logger.js.map