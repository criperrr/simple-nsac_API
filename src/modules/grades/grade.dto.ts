import {
    RecoveryMessage,
    RecoveryStatusCode,
} from "../nsac-scrapping/nsac.types.js";

export interface Grade {
    id_grade: number;
    id_user: number;
    id_subject: number;
    id_bimester: number;
    grade: number | null;
    averageGrade: number | null;
    statusRec: RecoveryStatusCode;
    recMessage: RecoveryMessage;
    approved: boolean;
    bimester: 1 | 2 | 3 | 4;
    recovered: boolean | null;
}

export interface CreateGradeDTO extends Omit<
    Grade,
    "id_grade" | "id_bimester"
> {}

// Subject DTOs
export interface Subject {
    id_subject: number;
    id_year: number;
    abbreviation: string;
    name: string;
}

export interface CreateSubjectDTO extends Omit<Subject, "id_subject"> {}

// SchoolYear DTOs
export interface SchoolYear {
    id_year: number;
    id_user: number;
    title: string;
    year: number;
    status: string;
}

export interface CreateSchoolYearDTO extends Omit<SchoolYear, "id_year"> {}
