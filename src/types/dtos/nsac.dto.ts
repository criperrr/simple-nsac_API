import { YearInfo } from "../models/nsac.js"

// Requests
export interface BasicNsacApiRequest {
    email: string;
    userId: string;
    password: string;
}

// Responses
export interface NsacAuthResponse {
    message: string;
    userId: string;
    nsacAccountId: number;
    apiToken: string;
}

export interface NsacToken {
    token: string;
    id_NsacAccount: number;
}

export type NsacTokensResponse = Array<NsacToken>;

export interface AllYearsResponse {
    warning: boolean | string;
    userCurrentYear: number;
    data: YearInfo[];
}
