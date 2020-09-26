export class ControlledError extends Error {

    soft:Boolean

    constructor(message?:string){
        super(message)
    }
    
}
