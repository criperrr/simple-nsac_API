import { PoolClient } from "pg";
import { insertSql, queryOne } from "../../../../shared/database/database.js";
import { InternalError } from "../../../../shared/log/errors/ApiError.js";
import { CreateApiTokenDTO, ApiToken } from "./apitokens.dto.js";

export async function createApiToken(
    apiToken: CreateApiTokenDTO,
    client?: PoolClient,
): Promise<ApiToken> {
    const result = await insertSql<ApiToken>(
        "INSERT INTO ApiTokens (id_user, token) VALUES ($1, $2);",
        [apiToken.id_user, apiToken.token],
        client,
    );
    if (!result) throw new InternalError("cannot create:\n" + result);

    return result;
}

// This function must be called only before a authentication validation, verifying that the email and the password are correct to use the account
export async function getApiTokenByEmail(
    email: string,
    client?: PoolClient,
): Promise<ApiToken | null> {
    return await queryOne<ApiToken>(
        "SELECT * FROM ApiTokens WHERE email = $1;",
        [email],
        client,
    );
}
