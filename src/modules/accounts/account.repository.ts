import { insertSql, queryOne } from "../../shared/database/database.js";
import { InternalError } from "../../shared/errors/ApiError.js";
import { Account, CreateAccountDTO } from "./account.dto.js";
import crypto from "bcryptjs";

export async function createUser(user: CreateAccountDTO): Promise<Account> {
    const result = await insertSql<Account>(
        "INSERT INTO Accounts (nsac_email, nsac_pass, nsac_crypted_cookies) VALUES ($1, $2, $3) RETURNING *;",
        [
            user.nsac_email,
            crypto.hashSync(user.nsac_pass, 10),
            user.nsac_crypted_cookies,
        ],
    );
    if (!result) {
        throw new InternalError(result + "");
    }

    return result;
}

export async function getUserByEmail(email: string): Promise<Account | null> {
    const result = await queryOne<  Account>(
        "SELECT * FROM Accounts WHERE nsac_email = $1;",
        [email],
    );
    return result;
}