type getAllRepportsByUserId = {
    title: string,
    content: string,
    monthIndice: number,
    UserId: number,
    files: string,
    createdAt: string
}

export type AttendancesResponseDto = {
    data: AttendanceListDto[]
};

export type Attendance = {
    arrivalTime: string | null;
    resumeTime: string | null;
    breakStartTime: string | null;
    departureTime: string | null;
    dailySalary: string | null;
    status: string | null;
    netSalary: string | null;
};

export type PresenceItem = AttendancesResponseDto['data'][number]

export type WeekDay = {
    id: number;
    name: string;
    number: string;
    createdAt: string;
    updatedAt: string;
};

export type PlanningType = {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    EnterpriseId: number;
};

export type Planning = {
    startTime: string;
    breakingStartTime: string;
    resumeEndTime: string;
    endTime: string;
    EnterpriseId: number
};


export type Enterprise = {
    id: number;
    CityId: number;
    CountryId: number;
    createdAt: string;
    updatedAt: string;
    name: string;
    description: string;
    logo: string;
    activityDomain: string;
    phone: string;
    email: string;
    address: string;
    website: string;
    latitude: string;
    longitude: string;
    legalForm: string;
    rccm: string;
    nui: string | null;
    subscriptionType: string;
    subscriptionStatus: string;
    EnterpriseId: number | null;
    toleranceTime: string;
    pourcentageOfHourlyDeduction: string;
    maxToleranceTime: string;
    maxPourcentageOfHourlyDeduction: string;
    MainEnterpriseId: number | null;
};

export type EnterprisesResponseDto = {
    message: string,
    data: Enterprise[]
}

// Type d'un élément individuel de votre réponse
export type EmployeeScheduleItem = {
    id: number;
    WeekDaysId: number;
    PlanningTypeId: number;
    PlanningId: number;
    UserId: number;
    updatedAt: string | null;
    createdAt: string;
    EnterpriseId: number;
    WeekDay: WeekDay;
    PlanningType: PlanningType;
    Planning: Planning;
    User: User;
    Enterprise: Enterprise;
};

// Type racine si la réponse API contient la clé "data"
export type EmployeeScheduleResponse = {
    data: EmployeeScheduleItem;
};

export type AttendanceSalary = {
    id: number;
    netSalary: string;
    dailySalary: string;
};

export type AttendanceUser = {
    id: number;
    firstname: string;
    lastname: string;
    photo: string;
};

export type AttendancePlanning = {
    id: number;
    title: string;
    startTime: string;
    endTime: string;
};

export type AttendanceEnterprise = {
    id: number;
    name: string;
    logo: string;
    MainEnterpriseId: number;
};

// Type d'un élément individuel de présence (le contenu de `data`)
export type AttendanceListDto = {
    arrivalTime: string;
    subscriptionStatus: string;
    subscriptionType: string;
    departureTime: string;
    breakStartTime: string;
    resumeTime: string;
    UserId: number;
    SalaryId: number;
    PlanningId: number;
    EnterpriseId: number;
    status: string;
    mounth: number;
    Salary: AttendanceSalary;
    User: AttendanceUser;
    Planning: AttendancePlanning;
    Enterprise: AttendanceEnterprise;
    createdAt: string
};


export type DepartmentPost = {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    EnterpriseId: number;
};

// export type Post = {
//     // id: number;
//     title: string;
//     description: string;
//     // EnterpriseId: number;
//     // DepartmentPostId: number;
//     // createdAt: string;
//     // updatedAt: string;
// };

export type Country = {
    id: number;
    name: string;
    code: string;
    City: City[];
    createdAt: string;
    updatedAt: string;
};


export type District = {
    id: number;
    name: string;
    CityId: number;
    createdAt: string;
    updatedAt: string;
    CountryId: number;
};

// Modèle utilisateur (correspondant au sous-objet `data`)
export type User = {
    id: number;
    firstname: string;
    lastname: string;
    phone: string;
    address: string;
    birthDate: string;
    email: string;
    status: boolean;
    gender: string;
    photo: string;
    password?: string;
    EnterpriseId: number;
    MainEnterpriseId: number;
    DepartmentPostId: number;
    PostId: number;
    marialStatus: string;
    SalaryId: number;
    CountryId: number;
    CityId: number;
    DistrictId: number;
    QuarterId: number;
    createdAt: string;
    updatedAt: string;
    PlanningId: number;
    PlanningTypeId: number;
    ContractTypeId: number;
    ContractId: number;
    role: string;
    adminService: string;

    // Relations
    Enterprise: Enterprise;
    DepartmentPost: DepartmentPost;
    Post: Post;
    Planning: Planning;
    PlanningType: PlanningType;
    ContractType: ContractType;
    Contract: Contract;
    Salary: Salary;
    Country: Country;
    City: City;
    District: District;
    Quarter: Quarter;
};

// Structure globale de la réponse API
export type UserResponseDto = {
    message: string;
    data: User;
};

export type UsersResponseDto = {
    message: string;
    data: User[];
};

export interface AttendanceDto {
    arrivalTime: string;
    departureTime: string;
    breakStartTime: string;
    resumeTime: string;
    UserId: number;
    SalaryId: number;
    PlanningId: number;
    EnterpriseId: number;
    status: string;
    mounth: number;
    field: string;
}

// Si tu utilises class-validator / NestJS :
export type CreateAttendanceDto = {
    arrivalTime: string;
    departureTime: string;
    breakStartTime: string;
    resumeTime: string;
    UserId: number;
    SalaryId: number;
    PlanningId: number;
    EnterpriseId: number;
    status: string;
    mounth: number;
    field: string;
}

export type CreateAttendanceResponseDto = {
    message: string,
    data: CreateAttendanceDto
}
// Type de la réponse globale reçue de l'API
export type AttendanceSingleResponseDto = {
    data: AttendanceListDto;
};

export interface Report {
    id: number;
    title: string;
    UserId: number;
    content: string;
    files: string | null;
    dayIndice: number;
    monthIndice: number;
    adminResponse: string | null;
    EnterpriseId: number;
    createdAt: string;
    updatedAt: string;
    User: User;
    Enterprise: Enterprise;
}

export interface ReportResponseDto {
    message: string;
    data: Report[];
}
export type AppointmentDto = {
    fullName: string;
    email: string;
    phone: string;
    UserId: number;
    date: string;
    time: string;
    reason: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | string;
};

export type AppointmentListDto = {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    UserId: number;
    date: string;
    time: string;
    reason: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | string;
    User: {
        lastname: string,
        firstname: string
    }
};

export type AppointmentsResponseDto = {
    message: string;
    data: AppointmentListDto[];
};

export type AppointmentSingleResponseDto = {
    message: string;
    data: AppointmentListDto;
};

export type UploadFileResponseDto = {
    message: string;
    filePath: string;
    filename: string;
    mimetype: string;
    size: number;
};

type AdminUser = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    image: string;
    authToken: string;
    refreshToken: string;
    adminRole: string;
    EnterpriseId: number;
    adminService: string;
    MainEnterpriseId: number;
};

export type LoginAdminResponseDto = {
    status: boolean;
    message: string;
    user: AdminUser;
};

type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export type RefreshTokenResponseDto = {
    message: string;
    data: AuthTokens;
};

export type VerifyOtpResponse = {
    resetToken: string;
    expiresIn: number;
};

export type UsersPlanningsDto = {
    id: number;
    WeekDaysId: number;
    PlanningTypeId: number;
    PlanningId: number;
    UserId: number;
    EnterpriseId: number;
    createdAt: string;
    updatedAt: string;
    WeekDay: WeekDay;
    PlanningType: PlanningType;
    Planning: Planning;
    User: User;
    Enterprise: Enterprise;
};

export type UsersPlanningsResponseDto = {
    message: string;
    data: UsersPlanningsDto[];
};

export type CountryResponseDto = {
    message: string;
    data: Country[];
};

export type PlanningsResponseDto = {
    message: string;
    data: Planning[];
};

export interface Department {
    id: number;
    name: string;
    description: string;
    EnterpriseId: number | null;
    createdAt: string;
    updatedAt: string;
    Enterprise?: Enterprise | null;
    User?: User[];
    Post?: Post[];
}

export type DepartmentsResponseDto = {
    message: string,
    data: Department[]
}

// --- TYPES DE RÉPONSE API GENÉRIQUES ---

export type PostsResponseDto = {
    message: string;
    data: Post[];
}

export interface Salary {
    id: number;
    grossSalary: string;
    dailySalary: string;
    netSalary: string;
    EnterpriseId: number | null;
    PostId: number | null;
    createdAt: string;
    updatedAt: string;
    Enterprise: Enterprise;
    Post: Post;
    User: User[];
}

export type SalariesResponseDto = {
    message: "success",
    data: Salary[],
}

export interface ContractType {
    id: number;
    title: string;
    description: string | null;
    EnterpriseId: number | null;
    createdAt: string;
    updatedAt: string;
    Enterprise: Enterprise;
    User: User;
}

export type ContractTypesResponseDto = {
    message: string,
    data: ContractType[]
}

export interface Contract {
    id: number;
    startDate: string | null;
    endDate: string | null;
    delay: string | null;
    ContractTypeId: number | null;
    EnterpriseId: number | null;
    createdAt: string;
    updatedAt: string;
    ContracType: ContractType;
    Enterprise: Enterprise;
    User: User[];
}

export type ContractsResponseDto = {
    message: string,
    data: Contract[]
}

export interface City {
    id?: number;
    name: string;
    CountriesTypeId: number | null;
    CountryId: number | null;
    createdAt?: string;
    updatedAt?: string;
    Country?: Country;
}

export type CitiesResponseDto = {
    message: 'success',
    data: City[]
}

export type CitiyResponseDto = {
    message: 'success',
    data: City
}

export interface DistrictDto {
    id: number;
    name: string;
    CityId: number;
    CountryId: number;
    createdAt: string;
    updatedAt: string;
    City: City;
    Country: Country;
    User: User[];
}

export type DistrictResponseDto = {
    message: string,
    data: District[]
}

export interface Quarter {
    name: string;
    DistrictId: number | null;
    District?: District | null;
    CityId: number | null;
    City?: City | null;
    CountryId: number | null;
    Country?: Country | null;
}

export type QuartersResponseDto = {
    message: string,
    data: Quarter[]
}


export type QuarterResponseDto = {
    message: string,
    data: Quarter
}

export interface Post {
  id: number;
  title: string;
  description: string;
  EnterpriseId: number;
  DepartmentPostId: number;
  createdAt: string;
  updatedAt: string;
  Enterprise: Enterprise;
  DepartmentPost: DepartmentPost;
  User: User[];
  Salary: Salary[];
}

export type PostResponseDto = {
    message: string,
    data: Post[]
}


export type PotsResponseDto = {
    message: string,
    data: Post
}