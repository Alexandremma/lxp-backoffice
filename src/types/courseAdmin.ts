export type CourseCategory = "graduation" | "postgraduate" | "extension" | "free_course"

export type CourseStatus = "draft" | "active" | "archived"

export type CourseAdmin = {
    id: string
    name: string
    description: string
    category: CourseCategory
    status: CourseStatus
    periods: number
    totalStudents: number
    createdAt: string
    externalLibraryId?: string
}

/** Dados editáveis no modal de curso (períodos são gerenciados só na aba Grades). */
export type CourseAdminInput = Pick<CourseAdmin, "name" | "description" | "category" | "status">
