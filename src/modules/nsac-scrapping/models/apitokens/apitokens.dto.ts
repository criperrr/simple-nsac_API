export interface ApiToken {
    id_token: number;
    id_user: number;
    token: string;
    created_at: Date;
}

export interface CreateApiTokenDTO extends Omit<ApiToken, "id_token" | "created_at"> {}