// * Common API Wrappers
export type {
    ApiError,
    ApiSuccess,
    ApiFailure,
    ApiResponse,
} from "./common/api.js";

// * Common Filter & Query Types
export type {
    NumberFilter,
    StringFilter,
    BooleanFilter,
    FilterBuilder,
    GradeQueryFields,
    QueryFilter,
} from "./common/filters.js";

// * Data Models (Entities)
// Pure data structures (boletim, grades, year)
export type {
    RecoveryStatusCode,
    RecoveryMessage,
    BoletimData,
    YearInfo,
    ResultData,
    FullGrades,
    UnifiedBimesterData,
    BimesterData,
    PersonalBiInformation,
    ClassBiInformation,
} from "./models/nsac.js";

// * Auth DTOs (Requests & Responses)
// Everything related to login, register and auth tokens
export type {
    RegisterAuthRequest,
    DeleteTokenRequest,
    RegisterResponse,
    LoginResponse,
    DeleteTokenResponse,
    JwtTokenPayload,
} from "./dtos/auth.dto.js";

// * NSAC Integration DTOs
// Everything related specifically to NSAC scrapping
export type {
    BasicNsacApiRequest,
    NsacAuthResponse,
    NsacToken,
    NsacTokensResponse,
    AllYearsResponse,
} from "./dtos/nsac.dto.js";
