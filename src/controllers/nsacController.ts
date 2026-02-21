import { NextFunction, Request, Response } from "express";

import { decrypt, encrypt } from "../utils/crypto.js";
import db, { queryOne } from "../utils/database.js";
import { login } from "../utils/loginNsac.js";
import { getGrades } from "../utils/getGrades.js";
import { success } from "../utils/responseHelpers.js";
import { filterQuery } from "../services/nsacService.js";

import { AppError } from "../types/ApiError.js";

import { ApiResponse, QueryFilter } from "../types/index.js";
import { ApiBodyRequest } from "../types/common/api.js";
import { NsacUser } from "../models/nsacUser.js";
import { hash } from "node:crypto";
import { hashSync } from "bcryptjs";

export async function getApiGrades(
    req: Request<{}, ApiResponse<any>, ApiBodyRequest, QueryFilter>,
    res: Response,
    next: NextFunction,
) {
    const email = req.body.email;
    const password = req.body.password;

    try {
        let decryptedCookies: string | undefined;

        // 2) If we don't have a valid cookie yet, try to find the NSAC account by email
        if (email && password) {
            try {
                const account = await queryOne<NsacUser>(
                    `SELECT id_nsacaccount, password FROM NsacAccount WHERE email = ?`,
                    [email],
                    db,
                );

                if (account && account.password) {
                    try {
                        const decryptedPass = decrypt(account.password);
                        if (decryptedPass === password) {
                            // password matches stored password -> try to use stored cookie for that account
                            try {
                                const tokenRow = await queryOne<any>(
                                    `SELECT nsac_crypted_cookies FROM Users WHERE id_nsacaccount = ?`,
                                    [account.id_nsacaccount],
                                    db,
                                );
                                const enc = tokenRow?.cookieString ?? tokenRow?.cookiestring;
                                if (enc) {
                                    try {
                                        decryptedCookies = decrypt(enc);
                                    } catch (e) {
                                        decryptedCookies = undefined;
                                    }
                                }
                            } catch (e) {
                                // ignore and fallback to login
                            }
                        } else {
                            throw new AppError(
                                "Authentication with db failed.",
                                401,
                                "UNAUTHORIZED",
                            );
                        }
                    } catch (e) {
                        // decrypt failed: fallback to login below
                    }
                } else {
                    const cookieString = await login(email, password);
                    queryOne<any>(
                        "INSERT INTO Users(nsac_email, nsac_hash_pass, nsac_crypted_cookies) VALUES (?, ?, ?)",
                        [email, hashSync(password), encrypt(cookieString)],
                        db,
                    );
                }
            } catch (err) {
                // no account found or db error -> fallback to login
            }
        }

        // 3) If we still don't have cookies, try to login with provided credentials
        if (!decryptedCookies) {
            if (!email || !password)
                throw new AppError(
                    "No credentials provided to obtain session",
                    401,
                    "MISSING_CREDENTIALS",
                );

            const newCookie = await login(email, password);
            decryptedCookies = newCookie;

            try {
                const result = await queryOne<any>(
                    "UPDATE Users SET nsac_crypted_cookies=?",
                    [encrypt(newCookie)],
                    db,
                );
            } catch (e) {}
        }

        const grades = await getGrades(decryptedCookies as string);
        const filteredGrades = filterQuery(grades, req.query);
        if (!grades) {
            throw new AppError("Failed to retrieve grades from NSAC", 502, "UPSTREAM_ERROR");
        }
        const { warning, userCurrentYear } = grades;

        let data = {
            warning,
            userCurrentYear,
            filteredGrades,
        } as any;

        res.status(200).json(success(data));
    } catch (err: any) {
        next(err);
    }
}
