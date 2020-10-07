
export const normal = '\x1b[39;49m'
export const red = '\x1b[91m'
export const yellow = '\x1b[93m'
export const green = '\x1b[32m'

export function action(msg:string) :void {
    process.stdout.write(msg.padEnd(60,"."))
}
export function logErr(text: string) :void {
    console.error(red + "ERR: " + text + normal)
}
export function greenOK() :void {
    console.log(green + ": OK" + normal)
}
