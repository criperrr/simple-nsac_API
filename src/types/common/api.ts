export interface ApiError {
    code: string;
    message: string;
    warning?: string;
    field?: string;
}

export interface ApiSuccess<T = any> {
    success: true;
    data: T;
    errors?: never;
}

export interface ApiFailure {
    success: false;
    data?: never;
    errors: Array<ApiError>;
}

export interface ApiBodyRequest {
    email: string;
    password: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiFailure;
