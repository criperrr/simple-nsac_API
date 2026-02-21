import { ApiError, ApiFailure, ApiSuccess } from "../types/index.js";

export function failure(error: ApiError[]): ApiFailure {
    return { success: false, errors: error };
}

export function success<T = any>(data: T): ApiSuccess<T> {
    return { success: true, data };
}

export function singleError(message: string, code: string, field?: string): ApiFailure {
    return field ? failure([{ message, code, field }]) : failure([{ message, code }]);
}
