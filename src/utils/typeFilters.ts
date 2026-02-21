import { AppError } from "../types/ApiError.js";
import { BooleanFilter, NumberFilter, StringFilter } from "../types/index.js";

function removerAcentos(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function numericFilter(value: number, filter: NumberFilter | Record<"0", number>): boolean {
    if ("0" in filter) {
        return value === filter["0"];
    }

    if (filter.eq !== undefined && value !== filter.eq) return false;
    if (filter.neq !== undefined && value === filter.neq) return false;
    if (filter.gt !== undefined && value <= filter.gt) return false;
    if (filter.gte !== undefined && value < filter.gte) return false;
    if (filter.lt !== undefined && value >= filter.lt) return false;
    if (filter.lte !== undefined && value > filter.lte) return false;

    return true;
}

function stringFilter(value: string, filter: StringFilter | Record<"0", string>): boolean {
    const parsedValue = removerAcentos(value).toLocaleLowerCase();
    if ("0" in filter) {
        return value === filter["0"];
    }

    if (filter.eq !== undefined && parsedValue !== filter.eq) return false;
    if (filter.contains !== undefined && !parsedValue.includes(filter.contains)) return false;
    if (filter.startsWith !== undefined && !parsedValue.startsWith(filter.startsWith)) return false;

    return true;
}

function booleanFilter(rowValue: boolean, filter: BooleanFilter | boolean): boolean {
    if (typeof filter === "boolean") {
        return rowValue === filter;
    }

    if (!filter) return true;
    const filterValue = parseBoolean(filter.eq);

    if (rowValue !== filterValue) return false;
    if (rowValue === filterValue) return false;

    return true;
}

function parseBoolean(value: any): boolean {
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return false;
    if (typeof value === "string") {
        return value.toLowerCase() === "true";
    }
    return false;
}

export function checkBooleanFilters(
    value: boolean,
    filters: BooleanFilter | boolean | string | string[]
): boolean {
    const sanitizedValue = parseBoolean(value);

    if (typeof filters === "string") {
        return booleanFilter(sanitizedValue, parseBoolean(filters));
    }

    if (typeof filters === "boolean") {
        return booleanFilter(sanitizedValue, filters);
    }

    if (Array.isArray(filters)) {
        return filters.some((f) => {
            if (typeof f === "string") return booleanFilter(sanitizedValue, parseBoolean(f));
            return booleanFilter(sanitizedValue, f as BooleanFilter);
        });
    }

    if (typeof filters === "object") {
        const sanitizedFilter: BooleanFilter = {};

        if ("eq" in filters && filters.eq !== undefined) {
            sanitizedFilter.eq = parseBoolean(filters.eq);
        }
        if ("neq" in filters && filters.neq !== undefined) {
            sanitizedFilter.neq = parseBoolean(filters.neq);
        }

        return booleanFilter(sanitizedValue, sanitizedFilter);
    }

    return true;
}

export function checkStringFilters(
    value: string,
    filters: StringFilter | Record<"0", string> | string | string[]
): boolean {
    if (typeof filters === "string" || Array.isArray(filters)) {
        const rawArray = Array.isArray(filters) ? filters : [filters];
        const cleanValues = rawArray
            .flatMap((item) => (typeof item === "string" ? item.split(",") : [item]))
            .map((val) => val.trim())
            .filter((val) => val !== ""); // Remove o lixo das vírgulas duplas

        return cleanValues.some((val) => {
            const parsedVal = removerAcentos(val).toLocaleLowerCase();
            return stringFilter(value, { eq: parsedVal });
        });
    }
    const flattenedFilters = Object.entries(filters)
        .map(([key, value]) => {
            const splitValues = [removerAcentos(value).toLocaleLowerCase()].flat(Infinity);
            console.log(splitValues);
            const flatValues = splitValues
                .map((val) => (typeof val === "string" ? val.trim().split(",") : val))
                .flat(Infinity);
            console.log(flatValues);
            return flatValues.map((val) => {
                return { [key]: val };
            });
        })
        .flat(Infinity) as StringFilter[];
    console.log(flattenedFilters);

    return flattenedFilters.some((filter) => stringFilter(value, filter));
}

export function checkNumberFilters(
    value: number | string,
    filters: NumberFilter | Record<"0", number>
): boolean {
    const flattenedFilters = Object.entries(filters)
        .map(([key, value]) => {
            const splitValues = [value].flat(Infinity);

            const flatValues = splitValues
                .map((val: number | string) =>
                    typeof val === "string" ? val.trim().split(",") : val
                )
                .flat(Infinity)
                .map((filter) => {
                    const numberValue = Number(filter);
                    if (Number.isNaN(numberValue))
                        throw new AppError("Invalid input parameters", 400, "INVALID_PARAMS");
                    return numberValue;
                });

            return flatValues.map((val) => {
                return { [key]: val };
            });
        })
        .flat(Infinity) as NumberFilter[];

    return flattenedFilters.some((filter) => {
        return numericFilter(value as number, filter);
    });
}
