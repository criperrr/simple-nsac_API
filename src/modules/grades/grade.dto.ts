import { RecoveryMessage, RecoveryStatusCode } from "../nsac-scrapping/nsac.types.js";

export interface Grade {
    id_grade:    number;
    id_user:     number;
    id_subject:  number;
    id_bimester: number;
    grade:       number | null;
    averageGrade: number | null;
    statusRec:   RecoveryStatusCode;
    recMessage:  RecoveryMessage;
    approved:    boolean;
    recovered:   boolean | null;
}

export interface CreateGradeDTO extends Omit<Grade, "id_grade" | "id_user"> {
    nsac_email: string;
}


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
    year: number;
    averageUserGrade: number | null;
    averageClassGrade: number | null;
    totalAbsences: number | null;
}

export interface CreateSchoolYearDTO extends Omit<SchoolYear, "id_year"> {}