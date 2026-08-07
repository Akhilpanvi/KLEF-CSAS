export type ID = string;

export interface BaseDTO {
  _id: ID;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentDTO extends BaseDTO {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UnitDTO extends BaseDTO {
  code: string;
  name: string;
  parentDepartment: DepartmentDTO | ID;
  isActive: boolean;
}

export interface CourseCategoryDTO extends BaseDTO {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface RegulationDTO extends BaseDTO {
  code: string;
  name?: string;
  isActive: boolean;
}

export interface SemesterDTO extends BaseDTO {
  number: number;
  name: string;
  isActive: boolean;
}

export interface CourseTypeDTO extends BaseDTO {
  name: string;
  isActive: boolean;
}

export type CourseStatus = "Active" | "Inactive" | "Archived";

export interface CourseDTO extends BaseDTO {
  regulation: RegulationDTO | ID;
  semester: SemesterDTO | ID;
  courseCode: string;
  courseName: string;
  courseCategory: CourseCategoryDTO | ID;
  L: number;
  T: number;
  P: number;
  S: number;
  contactHours: number;
  credits: number;
  courseType: CourseTypeDTO | ID;
  offeredByDepartment: DepartmentDTO | ID;
  offeredToDepartments: (DepartmentDTO | ID)[];
  courseCoordinatorName: string;
  courseCoordinatorEmployeeId: string;
  status: CourseStatus;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
