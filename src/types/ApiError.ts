import { ApiError } from "./index.js";

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
