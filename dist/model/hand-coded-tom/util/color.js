"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.greenOK = exports.logErr = exports.green = exports.yellow = exports.red = exports.normal = void 0;
exports.normal = '\x1b[39;49m';
exports.red = '\x1b[91m';
exports.yellow = '\x1b[93m';
exports.green = '\x1b[32m';
function logErr(text) {
    console.error(exports.red + "ERR: " + exports.normal + text);
}
exports.logErr = logErr;
function greenOK() {
    console.log(exports.green + "OK" + exports.normal);
}
exports.greenOK = greenOK;
//# sourceMappingURL=color.js.map