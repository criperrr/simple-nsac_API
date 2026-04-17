import { NextFunction, Request, Response } from "express";
import { CreateAccountDTO, Account } from "../accounts/account.dto.js";
import verifyEmptyFields from "../../shared/utils/emptyFields.js";
import { createUser, getUserByEmail } from "../accounts/account.repository.js";
import { AppError } from "../../shared/errors/ApiError.js";
import { login } from "./providers/loginNsac.js";
import { verifyCookie } from "./providers/verifyCookie.js";
import { success } from "../../shared/utils/responseHelpers.js";
import { generateRandomString } from "../../shared/utils/crypto.js";
import { createApiToken } from "../apitokens/apitokens.repository.js";
import { insertScrappingData } from "../grades/grade.service.js";

export async function getNsacGrades(req: Request, res: Response) {}

export async function createAccount(
    req: Request<{}, Account, CreateAccountDTO>,
    res: Response,
    next: NextFunction,
) {
    const cookies = req.body.nsac_crypted_cookies;
    const email = req.body.nsac_email;
    const pass = req.body.nsac_pass;
    console.log(req.body);
    verifyEmptyFields({ email, pass });

    try {
        if ((await getUserByEmail(email)) !== null)
            throw new AppError(
                "Already registered",
                409,
                "ENTITY_ALREADY_EXISTS",
                "email",
            );

        const nsacLogin = await login(email, pass);
        let userResult;
        if (cookies) {
            await verifyCookie(cookies);
        } else {
            req.body.nsac_crypted_cookies = nsacLogin;
        }

        userResult = await createUser(req.body);
        const returnedUser = {
            user_id: userResult.user_id,
            nsac_email: userResult.nsac_email,
            created_at: userResult.created_at,
        };

        const apiToken = "nsac_active_" + generateRandomString(128, true);

        const apiResult = await createApiToken({
            id_user: userResult.user_id,
            token: apiToken,
        });

        // return success and finish the request for client
        res.status(200).json(success({ user: returnedUser, apiToken }));

        await insertScrappingData(userResult, nsacLogin);

        return;
    } catch (e) {
        next(e);
    }
}
