export type CourseEnrollment = {
    courseId: string
    courseName: string
    enrollmentDate: string
    progress: number
    status: "active" | "inactive" | "completed" | "cancelled"
}

export type CourseStudentRow = {
    id: string
    name: string
    email: string
    avatarPath?: string | null
    avatarUpdatedAt?: string | null
    status: "active" | "inactive" | "blocked"
    lastAccess?: string | null
    /** ISO — perfil criado em */
    createdAt?: string
    phone?: string | null
    birthDate?: string | null
    enrollments: CourseEnrollment[]
}

export type StudentOption = {
    id: string
    name: string
    email: string
    avatarPath?: string | null
    avatarUpdatedAt?: string | null
    status: "active" | "inactive" | "blocked"
    enrollmentCount: number
}
