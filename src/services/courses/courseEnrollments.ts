import { fireAuditLog } from "@/lib/auditLogHelpers"
import { fetchProfileDisplay, profileDisplayById } from "@/services/avatarService"
import { supabase } from "@/lib/supabaseClient"
import type {
    CourseEnrollment,
    CourseStudentRow,
    StudentOption,
} from "@/types/courseEnrollments"
import {
    buildProgressStatusByKey,
    fetchCourseDisciplineIndex,
    fetchDisciplineProgressRows,
    resolveEnrollmentProgressPercent,
} from "./courseProgressIndex"
import { deriveStudentStatus, normalizeEnrollmentStatus } from "./enrollmentMappers"

function attachAvatarFields<T extends { id: string }>(
    rows: T[],
    displayById: Map<string, { avatar_path: string | null; updated_at: string }>,
): (T & { avatarPath: string | null; avatarUpdatedAt: string | null })[] {
    return rows.map((row) => {
        const display = displayById.get(row.id)
        return {
            ...row,
            avatarPath: display?.avatar_path ?? null,
            avatarUpdatedAt: display?.updated_at ?? null,
        }
    })
}

export async function getCourseStudentsAdmin(courseId: string, courseName: string): Promise<{
    enrolledStudents: CourseStudentRow[]
    allStudents: StudentOption[]
}> {
    const { data: enr, error: enrError } = await supabase
        .from("lxp_enrollments")
        .select("student_profile_id,status,created_at")
        .eq("course_id", courseId)

    if (enrError) throw enrError

    const enrolledProfileIds = Array.from(
        new Set((enr ?? []).map((e: { student_profile_id: string }) => e.student_profile_id)),
    )

    let enrolledProfiles: Array<{ id: string; name: string | null; email: string | null; updated_at: string | null }> = []
    if (enrolledProfileIds.length > 0) {
        const { data: prof, error: profError } = await supabase
            .from("lxp_profiles")
            .select("id,name,email,updated_at")
            .in("id", enrolledProfileIds)

        if (profError) throw profError
        enrolledProfiles = (prof ?? []) as typeof enrolledProfiles
    }

    const enrMap = new Map<string, { created_at: string; status: string }>()
    ;(enr ?? []).forEach((e: { student_profile_id: string; created_at: string; status: string }) =>
        enrMap.set(e.student_profile_id, { created_at: e.created_at, status: e.status }),
    )

    const disciplineIndex = await fetchCourseDisciplineIndex([courseId])
    const courseDiscIds = disciplineIndex.discByCourse.get(courseId) ?? []
    const progressRows =
        enrolledProfileIds.length > 0 && courseDiscIds.length > 0
            ? await fetchDisciplineProgressRows(enrolledProfileIds, courseDiscIds)
            : []
    const progressByKey = buildProgressStatusByKey(progressRows)

    const enrolledRowsBase = enrolledProfiles.map((p) => {
        const enrInfo = enrMap.get(p.id)
        return {
            id: p.id,
            name: p.name ?? p.email ?? p.id,
            email: p.email ?? "",
            status: enrInfo?.status === "inactive" ? "inactive" : "active",
            lastAccess: p.updated_at ?? null,
            enrollments: [
                {
                    courseId,
                    courseName,
                    enrollmentDate: enrInfo?.created_at ?? new Date().toISOString(),
                    progress: resolveEnrollmentProgressPercent(p.id, courseId, disciplineIndex, progressByKey),
                    status: (enrInfo?.status as CourseEnrollment["status"]) ?? "active",
                },
            ],
        }
    })

    const { data: all, error: allError } = await supabase
        .from("lxp_profiles")
        .select("id,name,email")
        .eq("role", "student")
        .order("created_at", { ascending: false })

    if (allError) throw allError

    const { data: allEnr, error: allEnrError } = await supabase
        .from("lxp_enrollments")
        .select("student_profile_id")

    if (allEnrError) throw allEnrError

    const counts = new Map<string, number>()
    ;(allEnr ?? []).forEach((e: { student_profile_id: string }) => {
        counts.set(e.student_profile_id, (counts.get(e.student_profile_id) ?? 0) + 1)
    })

    const optionsBase: Omit<StudentOption, "avatarPath" | "avatarUpdatedAt">[] = (all ?? []).map(
        (p: { id: string; name: string | null; email: string | null }) => ({
            id: p.id,
            name: p.name ?? p.email ?? p.id,
            email: p.email ?? "",
            status: "active" as const,
            enrollmentCount: counts.get(p.id) ?? 0,
        }),
    )

    const profileIds = [
        ...new Set([
            ...enrolledRowsBase.map((row) => row.id),
            ...optionsBase.map((row) => row.id),
        ]),
    ]
    const displayById = profileDisplayById(await fetchProfileDisplay(profileIds))

    const enrolledStudents = attachAvatarFields(enrolledRowsBase, displayById) as CourseStudentRow[]
    const allStudents = attachAvatarFields(optionsBase, displayById) as StudentOption[]

    return { enrolledStudents, allStudents }
}

/**
 * Lista global de alunos (perfil `student`) com matrículas e progresso médio por curso,
 * baseado em `lxp_student_discipline_progress` vs. disciplinas do curso.
 */
export async function getAllStudentsAdmin(): Promise<CourseStudentRow[]> {
    const { data: profiles, error: profilesError } = await supabase
        .from("lxp_profiles")
        .select("id,name,email,phone,birth_date,created_at,updated_at")
        .eq("role", "student")
        .order("created_at", { ascending: false })

    if (profilesError) throw profilesError

    const { data: enrollmentsRaw, error: enrError } = await supabase
        .from("lxp_enrollments")
        .select("student_profile_id,course_id,status,created_at")

    if (enrError) throw enrError

    const courseIds = [...new Set((enrollmentsRaw ?? []).map((e: { course_id: string }) => e.course_id))]
    const courseNameById = new Map<string, string>()
    if (courseIds.length > 0) {
        const { data: courses, error: coursesError } = await supabase.from("lxp_courses").select("id,name").in("id", courseIds)
        if (coursesError) throw coursesError
        for (const c of courses ?? []) courseNameById.set((c as { id: string; name: string }).id, (c as { id: string; name: string }).name)
    }

    const disciplineIndex = await fetchCourseDisciplineIndex(courseIds)
    const profileIds = (profiles ?? []).map((p: { id: string }) => p.id)
    const allDiscIds = [...new Set([...disciplineIndex.discByCourse.values()].flat())]

    const progressRows =
        profileIds.length > 0 && allDiscIds.length > 0
            ? await fetchDisciplineProgressRows(profileIds, allDiscIds)
            : []
    const progressByKey = buildProgressStatusByKey(progressRows)

    const progressForEnrollment = (studentId: string, courseId: string): number =>
        resolveEnrollmentProgressPercent(studentId, courseId, disciplineIndex, progressByKey)

    const enrByStudent = new Map<string, CourseEnrollment[]>()
    const rawStatusByStudent = new Map<string, string[]>()
    for (const e of enrollmentsRaw ?? []) {
        const row = e as {
            student_profile_id: string
            course_id: string
            status: string
            created_at: string
        }
        const courseName = courseNameById.get(row.course_id) ?? "Curso"
        const enrollment: CourseEnrollment = {
            courseId: row.course_id,
            courseName,
            enrollmentDate: row.created_at,
            progress: progressForEnrollment(row.student_profile_id, row.course_id),
            status: normalizeEnrollmentStatus(row.status),
        }
        if (!enrByStudent.has(row.student_profile_id)) enrByStudent.set(row.student_profile_id, [])
        enrByStudent.get(row.student_profile_id)!.push(enrollment)
        if (!rawStatusByStudent.has(row.student_profile_id)) rawStatusByStudent.set(row.student_profile_id, [])
        rawStatusByStudent.get(row.student_profile_id)!.push(row.status)
    }

    const rowsBase = (profiles ?? []).map((p: {
        id: string
        name: string | null
        email: string | null
        phone: string | null
        birth_date: string | null
        created_at: string
        updated_at: string
    }) => {
        const enrollments = enrByStudent.get(p.id) ?? []
        return {
            id: p.id,
            name: p.name ?? p.email ?? p.id,
            email: p.email ?? "",
            status: deriveStudentStatus(rawStatusByStudent.get(p.id) ?? []),
            lastAccess: p.updated_at,
            createdAt: p.created_at,
            phone: p.phone,
            birthDate: p.birth_date,
            enrollments,
        }
    })

    const displayById = profileDisplayById(await fetchProfileDisplay(rowsBase.map((row) => row.id)))
    return attachAvatarFields(rowsBase, displayById) as CourseStudentRow[]
}

export async function enrollStudentsAdmin(courseId: string, studentIds: string[]): Promise<void> {
    const toInsert = studentIds.map((id) => ({
        student_profile_id: id,
        course_id: courseId,
        status: "active",
    }))

    if (toInsert.length === 0) return

    const { error } = await supabase.from("lxp_enrollments").insert(toInsert)
    if (error) throw error

    fireAuditLog({
        action: "enrollment.enroll",
        entityType: "lxp_enrollment",
        entityId: courseId,
        metadata: { courseId, studentCount: studentIds.length },
    })
}

export async function setCourseEnrollmentStatusAdmin(params: {
    courseId: string
    studentProfileId: string
    status: "active" | "inactive"
}): Promise<void> {
    const { error } = await supabase
        .from("lxp_enrollments")
        .update({
            status: params.status,
            updated_at: new Date().toISOString(),
        })
        .eq("course_id", params.courseId)
        .eq("student_profile_id", params.studentProfileId)

    if (error) throw error

    fireAuditLog({
        action: "enrollment.status_update",
        entityType: "lxp_enrollment",
        entityId: params.studentProfileId,
        metadata: {
            courseId: params.courseId,
            status: params.status,
        },
    })
}
