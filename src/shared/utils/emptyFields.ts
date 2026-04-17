import { MultiAppErrors } from "../types/ApiError.js";

export default function verifyEmptyFields(fields: Record<string, string>): void {
    let emptyFields: Array<string> = [];
    for (const key in fields) {
        if (!fields[`${key}`]) {
            emptyFields.push(`${key}`);
        }
    }
    if (emptyFields.length != 0) {
        const errors = emptyFields.map((field) => ({
            field: field,
            message: `Empty field ${field}`,
            code: "REG_MISSING_FIELD",
        }));
        throw new MultiAppErrors(errors, 400);
    }
}
