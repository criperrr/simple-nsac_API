import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/ApiError.js";
import verifyEmptyFields from "../utils/emptyFields.js";
import { ApiBodyRequest } from "../types/api.js";

export async function checkBody(req: Request, _: Response, next: NextFunction) {
    try {
        if (!req.body) {
            throw new AppError(
                "Missing request body",
                400,
                "MISSING_REQUEST_BODY",
            );
        }
        const body = req.body as ApiBodyRequest;
        const email = body.email;
        const pass = body.password;
        verifyEmptyFields({ email, pass });
        next();
    } catch (err: any) {
        next(err);
    }
}
