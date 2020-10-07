export class ControlledError extends Error {
    soft:boolean

    constructor(message?:string) {
        super(message)
    }
}
