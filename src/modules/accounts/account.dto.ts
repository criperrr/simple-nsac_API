export interface Account {
    user_id: number;
    nsac_email: string;
    nsac_pass: string;
    nsac_crypted_cookies?: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface CreateAccountDTO extends Omit<Account, "user_id" | "created_at" | "updated_at"> {}