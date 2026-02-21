import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/ApiError.js";

export async function checkBody(req: Request, _: Response, next: NextFunction) {
    try {
        if (!req.body) {
            throw new AppError("Missing request body", 400, "MISSING_REQUEST_BODY");
        }
        if(!req.body.email){
            throw new AppError("Missing Nsac email field in body", 401, "MISSING_NSAC_EMAIL");
        }
        if(!req.body.pass){
            throw new AppError("Missing Nsac pass field in body", 401, "MISSING_NSAC_PASSWORD");
        }
        next();
    } catch (err: any) {
        next(err);
    }
}
