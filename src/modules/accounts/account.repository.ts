import { insertSql, queryOne } from "../../shared/database/database.js";
import { InternalError } from "../../shared/errors/ApiError.js";
import { encrypt } from "../../shared/utils/crypto.js";
import { Account, CreateAccountDTO } from "./account.dto.js";

export async function createUser(user: CreateAccountDTO): Promise<Account> {
    const result = await insertSql<Account>(
        "INSERT INTO Accounts (nsac_email, nsac_pass, nsac_crypted_cookies) VALUES ($1, $2, $3) RETURNING *;",
        [
            user.nsac_email,
            encrypt(user.nsac_pass),
            user.nsac_crypted_cookies,
        ],
    );
    if (!result) {
        throw new InternalError("cannot create: " + result + "");
    }

    return result;
}

export async function getUserByEmail(email: string): Promise<Account | null> {
    return await queryOne<Account>(
        "SELECT * FROM Accounts WHERE nsac_email = $1;",
        [email],
    );
}

export async function getUserByToken(token: string): Promise<Account | null> {
    return await queryOne<Account>(
        `SELECT a.* FROM Accounts a
        JOIN ApiTokens t ON a.user_id = t.id_user
        WHERE t.token = $1;`,
        [token],
    );
}