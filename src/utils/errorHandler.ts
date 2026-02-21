import { Request, Response, NextFunction } from "express";
import { AppError, MultiAppErrors } from "../types/ApiError.js";
import { failure, singleError } from "./responseHelpers.js";

export function globalErrorHandling(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.HTTPCode).json(singleError(err.message, err.errorCode, err.field));
    }

    if (err instanceof MultiAppErrors) return res.status(err.HTTPCode).json(failure(err.errors));

    console.log("Error not instance of common AppError or MultiAppErrors:");
    console.log(err);
    return res.status(500).json(singleError("Internal server error", "API_SERVER_ERROR"));
}
