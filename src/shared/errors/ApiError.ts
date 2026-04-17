import { ApiError } from "../types/api.js";

export class AppError extends Error {
    public readonly HTTPCode: number;
    public readonly field?: string | undefined;
    public readonly errorCode: string;

    constructor(message: string, HTTPCode: number, errorCode: string, field?: string) {
        super(message);
        this.HTTPCode = HTTPCode;
        this.field = field;
        this.errorCode = errorCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class InternalError extends AppError {
    constructor(debug?: string){
        console.log(debug);
        super('Internal App Error', 500, 'INTERNAL_APP_ERROR');
        Object.setPrototypeOf(this, InternalError.prototype);
    }
}

export class MultiAppErrors extends Error {
    public readonly HTTPCode: number;
    public readonly errors: ApiError[];

    constructor(errors: ApiError[], HTTPCode = 400) {
        super("Multiple validation errors");
        this.HTTPCode = HTTPCode;
        this.errors = errors;
        Object.setPrototypeOf(this, MultiAppErrors.prototype);
    }
}
