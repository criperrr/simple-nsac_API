import { NextFunction, Request, Response } from "express";
import { CreateAccountDTO, Account } from "./models/accounts/account.dto.js";
import verifyEmptyFields from "../../shared/utils/emptyFields.js";
import {
    createUser,
    getUserByEmail,
    getUserByToken,
} from "./models/accounts/account.repository.js";
import { AppError, InternalError } from "../../shared/log/errors/ApiError.js";
import { login } from "./providers/loginNsac.js";
import { verifyCookie } from "./providers/verifyCookie.js";
import { success } from "../../shared/utils/responseHelpers.js";
import { generateRandomString } from "../../shared/utils/crypto.js";
import { createApiToken } from "./models/apitokens/apitokens.repository.js";
import { insertScrappingData } from "./models/grades/grade.service.js";
import { logInfo } from "../../shared/log/logger.js";

export async function getNsacGrades(
    req: Request<{}, {}, { apiToken: string }>,
    res: Response,
    next: NextFunction,
) {
    const { apiToken } = req.body;
    try {
        if (!apiToken) {
            throw new AppError(
                "Missing nsac_crypted_cookies in request body",
                400,
                "MISSING_FIELD",
                "nsac_crypted_cookies",
            );
        }

        const user = await getUserByToken(apiToken);
        if (!user) {
            throw new AppError(
                "Invalid nsac_crypted_cookies token",
                401,
                "INVALID_TOKEN",
                "nsac_crypted_cookies",
            );
        }

        // const boletim = await getBoletimsByUser(user);
    } catch (e) {
        next(e);
    }
}

export async function createAccount(
    req: Request<{}, Account, CreateAccountDTO>,
    res: Response,
    next: NextFunction,
) {
    const cookies = req.body.nsac_crypted_cookies;
    const email = req.body.nsac_email;
    const pass = req.body.nsac_pass;
    verifyEmptyFields({ email, pass });

    try {
        if ((await getUserByEmail(email)) !== null)
            throw new AppError(
                "Already registered",
                409,
                "ENTITY_ALREADY_EXISTS",
                "email",
            );

        const startTime = Date.now();
        await logInfo(`Creating account for email: ${email}`);

        const nsacLogin = await login(email, pass);
        let userResult;
        if (cookies) {
            await verifyCookie(cookies); // it launches expections when the cookie is invalid
        } else {
            req.body.nsac_crypted_cookies = nsacLogin;
        }

        userResult = await createUser(req.body);
        const returnedUser = {
            id_user: userResult.id_user,
            nsac_email: userResult.nsac_email,
            created_at: userResult.created_at,
        };

        const apiToken = "nsac_token_" + generateRandomString(128, true);

        const apiResult = await createApiToken({
            id_user: userResult.id_user,
            token: apiToken,
        });

        if (!apiResult) throw new InternalError("result:\n " + apiResult);

        // return success and finish the request for client
        res.status(200).json(success({ user: returnedUser, apiToken }));

        await insertScrappingData(userResult, nsacLogin);
        const endTime = Date.now();
        await logInfo(
            `Account creation and data insertion completed for email: ${email} in ${(endTime - startTime) / 1000} seconds`,
        );
        return;
    } catch (e) {
        next(e);
    }
}
