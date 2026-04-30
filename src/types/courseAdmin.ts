export type CourseCategory = "graduation" | "postgraduate" | "extension"

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

export type CourseAdminInput = Omit<CourseAdmin, "id" | "totalStudents" | "createdAt">
