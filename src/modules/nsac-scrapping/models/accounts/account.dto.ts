export interface Account {
    id_user: number;
    nsac_email: string;
    nsac_hash_pass: string | null;
    nsac_pass: string;
    nsac_crypted_cookies: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface CreateAccountDTO extends Omit<Account, "id_user" | "created_at" | "updated_at"> {}

export interface AccountSchoolYear {
    id_association: number;
    id_user: number;
    id_year: number;
    status: string;
}

export interface CreateAccountSchoolYearDTO extends Omit<AccountSchoolYear, "id_association"> {}