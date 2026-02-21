import { NsacAccount } from "../models/nsacAccount.js";
import { AppError } from "../types/ApiError.js";
import { decrypt, encrypt } from "./crypto.js";
import db, { queryOne, runSql } from "./database.js";
import { login } from "./loginNsac.js";

export async function verifyCookie(token: string, APIToken?: string): Promise<string> {
    const responseTest = await fetch("http://200.145.153.1/nsac/home", {
        credentials: "include",
        headers: {
            Cookie: token,
        },
        method: "GET",
        redirect: "manual",
    });

    if (responseTest.status == 200) return token;
    else {
        if (APIToken) {
            try {
                const accountData = await queryOne<NsacAccount>(
                    `SELECT
                        NA.email,
                        NA.password
                    FROM
                        ApiToken AT
                    INNER JOIN
                        NsacAccount NA ON AT.id_NsacAccount = NA.id_NsacAccount
                    WHERE
                        AT.token = ?`,
                    [APIToken],
                    db
                );
                if (!accountData) throw new Error("Token not found");

                const decryptedPassword = decrypt(accountData.password);

                const newCookie = (await login(accountData.email, decryptedPassword)) as string;

                const encryptedNewCookie = encrypt(newCookie);

                await runSql(
                    "UPDATE ApiToken SET cookieString = ? WHERE token = ?",
                    [encryptedNewCookie, APIToken],
                    db
                );

                return newCookie;
            } catch (err) {
                console.error("Erro ao renovar cookie:");
                console.log(err);

                throw new AppError("Failed to refresh session", 500, "SESSION_REFRESH_ERROR");
            }
        }
        throw new AppError("Invalid cookie and no APIToken provided", 401, "NSAC_AUTH_EXPIRED");
    }
}
