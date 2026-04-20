import { PoolClient } from "pg";
import {
    insertSql,
    queryOne,
    runSql,
} from "../../../../shared/database/database.js";
import { InternalError } from "../../../../shared/log/errors/ApiError.js";
import { encrypt } from "../../../../shared/utils/crypto.js";
import {
    Account,
    AccountSchoolYear,
    CreateAccountDTO,
    CreateAccountSchoolYearDTO,
} from "./account.dto.js";

// export interface AccountSchoolYear {
//     id_association: number;
//     id_user: number;
//     id_year: number;
//     status: string;
// }

// export interface CreateAccountSchoolYearDTO extends Omit<AccountSchoolYear, "id_association"> {}

export async function createAccountSchoolYear(
    associationData: CreateAccountSchoolYearDTO,
    client?: PoolClient,
): Promise<AccountSchoolYear> {
    const result = await insertSql<AccountSchoolYear>(
        `INSERT INTO Accounts_SchoolYears (id_user, id_year, status) 
         VALUES ($1, $2, $3)`,
        [
            associationData.id_user,
            associationData.id_year,
            associationData.status,
        ],
        client,
    );

    if (!result) throw new InternalError("cannot create:\n" + result);

    return result;
}

export async function createUser(
    user: CreateAccountDTO,
    client?: PoolClient,
): Promise<Account> {
    const result = await insertSql<Account>(
        "INSERT INTO Accounts (nsac_email, nsac_pass, nsac_crypted_cookies) VALUES ($1, $2, $3);",
        [user.nsac_email, encrypt(user.nsac_pass), user.nsac_crypted_cookies],
        client,
    );
    if (!result) {
        throw new InternalError("cannot create: " + result + "");
    }

    return result;
}

export async function getUserByEmail(
    email: string,
    client?: PoolClient,
): Promise<Account | null> {
    return await queryOne<Account>(
        "SELECT * FROM Accounts WHERE nsac_email = $1;",
        [email],
        client,
    );
}

export async function setUserCookies(user: Account, client?: PoolClient) {
    const result = await runSql(
        `
        UPDATE Accounts SET nsac_crypted_cookies = $1 WHERE id_user = $2
        `,
        [user.nsac_crypted_cookies, user.id_user],
        client,
    );
}

export async function getUserByToken(
    token: string,
    client?: PoolClient,
): Promise<Account | null> {
    return await queryOne<Account>(
        `SELECT a.* FROM Accounts a
        JOIN ApiTokens t ON a.id_user = t.id_user
        WHERE t.token = $1;`,
        [token],
        client,
    );
}
