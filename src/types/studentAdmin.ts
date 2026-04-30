export type StudentEnrollment = {
    courseId: string
    courseName: string
    enrollmentDate: string
    progress: number
    status: "active" | "inactive" | "completed" | "cancelled"
}

export type StudentAdmin = {
    id: string
    name: string
    email: string
    role: "student"
    status: "active" | "inactive" | "blocked"
    enrollments: StudentEnrollment[]
    lastAccess: string
    createdAt: string
    phone?: string | null
    birthDate?: string | null
    avatar?: string
}
