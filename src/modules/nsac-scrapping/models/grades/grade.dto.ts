import { RecoveryMessage, RecoveryStatusCode } from "../../nsac.types.js";

export interface Grade {
    id_grade: number;
    id_user: number;
    id_subject: number;
    id_bimester: number;
    grade: number;
    averageGrade: number;
    statusRec: RecoveryStatusCode;
    recMessage: RecoveryMessage;
    approved: boolean;
    absences: number;
    recovered: boolean | null;
}

export interface CreateGradeDTO extends Omit<
    Grade,
    "id_grade" | "id_bimester"
> {}

// SchoolYear DTOs
export interface SchoolYear {
    id_year: number;
    year: number;
    title: string;
}

export interface CreateSchoolYearDTO extends Omit<SchoolYear, "id_year"> {}

export interface AccountSchoolYear {
    id_association: number;
    id_user: number;
    id_year: number;
    status: string;
}

export interface CreateAccountSchoolYearDTO extends Omit<AccountSchoolYear, "id_association"> {}

export interface Subject {
    id_subject: number;
    id_year: number;
    abbreviation: string;
    name: string;
}

export interface CreateSubjectDTO extends Omit<Subject, "id_subject"> {}

export interface Bimesters {
    id_bimester: number;
    id_user: number;
    id_year: number;
    bimester: 1 | 2 | 3 | 4;
    userAvarage: number;   // Mantido Avarage para espelhar o léxico do seu DDL
    classAvarage: number;  // Mantido Avarage para espelhar o léxico do seu DDL
    totalAbsences: number;
}

export interface CreateBimestersDTO extends Omit<Bimesters, "id_bimester"> {}

export interface Grade {
    id_grade: number;
    id_user: number;
    id_subject: number;
    id_bimester: number;
    grade: number;
    averageGrade: number;
    absences: number;
    statusRec: RecoveryStatusCode;
    recMessage: RecoveryMessage;
    approved: boolean;
    recovered: boolean | null;
}

export interface CreateGradeDTO extends Omit<Grade, "id_grade"> {}

export interface SubjectFinalResult {
    id_result: number;
    id_user: number;
    id_subject: number;
    final_grade: number | null;
    total_absences: number;
}

export interface CreateSubjectFinalResultDTO extends Omit<SubjectFinalResult, "id_result"> {}