import { inspect } from "util";
// ------------------------------
// -- function expect().toBe() --
// ------------------------------

// ---------------------------
function deepEqual(object1:any, object2:any) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (
            areObjects && !deepEqual(val1, val2) ||
            !areObjects && val1 !== val2
        ) {
            console.log(red+val1 + " !== " + val2 + normal)
            return false;
        }
    }

    return true;
}

function isObject(object) {
    return object != null && typeof object === 'object';
}

let savedTitle: string;
let saveReceived: any = undefined;
const red = '\x1b[91m'
const yellow = '\x1b[93m'
const green = '\x1b[32m'
const normal = '\x1b[39;49m'

function expect(title:string, received:any) {
    savedTitle = title || ""
    saveReceived = received
    return expect.prototype
}
expect.prototype.toBe = function (expected:any) {
    let eq = false;
    if (isObject(expected) && isObject(saveReceived)) {
        eq = deepEqual(expected, saveReceived)
    }
    else {
        eq = (expected == saveReceived)
    }
    if (!eq) {
        console.log(red+"ERR: expect failed: " + savedTitle +normal);
        console.log("      received: " + yellow+inspect(saveReceived, { depth: 10 })+normal);
        console.log("      expected: " + green+inspect(expected, { depth: 10 })+normal);
    }
    else {
        console.log(green+"OK: "+normal+savedTitle);
    }
    return expect.prototype
}

export default expect
