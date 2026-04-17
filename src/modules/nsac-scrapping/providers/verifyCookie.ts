import { AppError } from "../../../shared/errors/ApiError.js";
import { login } from "./loginNsac.js";

export async function verifyCookie(
    token: string,
    email?: string,
    pass?: string,
): Promise<string> {
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
        if (email && pass) {
            const token = await login(email, pass);
            return token;
        } else {
            throw new AppError(
                "Invalid db cookie and invalid email and password",
                401,
                "NSAC_UNAUTHORIZED",
            );
        }
    }
}
