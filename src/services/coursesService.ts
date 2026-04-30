import { supabase } from "@/lib/supabaseClient"
import type { CourseAdmin, CourseStatus } from "@/types/courseAdmin"
import { getLibraryDisciplineUrl } from "@/services/libraryAdapter"

type CourseDbRow = {
    id: string
    name: string
    description: string | null
    status: string
    category: string | null
    periods: number | null
    external_library_id: string | null
    created_at: string
}

export type CourseEnrollment = {
    courseId: string
    courseName: string
    enrollmentDate: string
    progress: number
    status: "active" | "inactive" | "completed" | "cancelled"
}

export type CourseStudentRow = {
    id: string // lxp_profiles.id
    name: string
    email: string
    avatar?: string
    status: "active" | "inactive" | "blocked"
    lastAccess?: string | null
    /** ISO — perfil criado em */
    createdAt?: string
    enrollments: CourseEnrollment[]
}

export type StudentOption = {
    id: string
    name: string
    email: string
    avatar?: string
    status: "active" | "inactive" | "blocked"
    enrollmentCount: number
}

export type CourseDisciplineAdmin = {
    id: string
    periodId: string
    name: string
    code: string
    workload: number
    credits: number
    professor?: string
    status: "active" | "inactive"
    linkedTrailId?: string
    linkedTrailName?: string
}

export type CoursePeriodAdmin = {
    id: string
    courseId: string
    number: number
    name: string
    status: "current" | "completed" | "upcoming"
    disciplines: CourseDisciplineAdmin[]
}

export type CourseLinkedContentAdmin = {
    id: string
    courseId: string
    libraryContentId: string
    libraryContentName: string
    externalUrl?: string
    type: "discipline"
    linkedAt: string
    linkedBy: string
    disciplineId?: string
    disciplineName?: string
}

export type CourseRecentActivityItem = {
    id: string
    action: string
    actor: string
    happenedAt: string
}

export async function getCoursesAdmin(): Promise<CourseAdmin[]> {
    const [coursesResult, enrollmentsResult, periodsResult] = await Promise.all([
        supabase
            .from("lxp_courses")
            .select("id,name,description,status,category,periods,external_library_id,created_at")
            .order("created_at", { ascending: false }),
        supabase.from("lxp_enrollments").select("course_id"),
        supabase.from("lxp_course_periods").select("course_id"),
    ])

    if (coursesResult.error) throw coursesResult.error
    if (enrollmentsResult.error) throw enrollmentsResult.error
    if (periodsResult.error) throw periodsResult.error

    const coursesData = coursesResult.data
    const enrollmentsData = enrollmentsResult.data
    const periodsData = periodsResult.data

    const countsByCourseId = new Map<string, number>()
    ;(enrollmentsData ?? []).forEach((e: { course_id: string }) => {
        countsByCourseId.set(e.course_id, (countsByCourseId.get(e.course_id) ?? 0) + 1)
    })

    const periodsByCourseId = new Map<string, number>()
    ;(periodsData ?? []).forEach((p: { course_id: string }) => {
        periodsByCourseId.set(p.course_id, (periodsByCourseId.get(p.course_id) ?? 0) + 1)
    })

    const mapped: CourseAdmin[] = (coursesData ?? []).map((c) => {
        const row = c as CourseDbRow
        return {
            id: row.id,
            name: row.name,
            description: row.description ?? "",
            category: (row.category as CourseAdmin["category"]) ?? "graduation",
            status: (row.status as CourseStatus) ?? "draft",
            periods: periodsByCourseId.get(row.id) ?? row.periods ?? 0,
            totalStudents: countsByCourseId.get(row.id) ?? 0,
            createdAt: row.created_at,
            externalLibraryId: row.external_library_id ?? undefined,
        }
    })

    return mapped
}

export async function getCourseDetailAdmin(courseId: string): Promise<CourseAdmin | undefined> {
    const [courseResult, enrollmentsResult, periodsResult] = await Promise.all([
        supabase
            .from("lxp_courses")
            .select("id,name,description,status,category,periods,external_library_id,created_at")
            .eq("id", courseId)
            .maybeSingle(),
        supabase.from("lxp_enrollments").select("student_profile_id").eq("course_id", courseId),
        supabase.from("lxp_course_periods").select("id").eq("course_id", courseId),
    ])

    if (courseResult.error) throw courseResult.error
    if (enrollmentsResult.error) throw enrollmentsResult.error
    if (periodsResult.error) throw periodsResult.error
    if (!courseResult.data) return undefined

    const row = courseResult.data as CourseDbRow
    const mapped: CourseAdmin = {
        id: row.id,
        name: row.name,
        description: row.description ?? "",
        category: (row.category as CourseAdmin["category"]) ?? "graduation",
        status: (row.status as CourseStatus) ?? "draft",
        periods: (periodsResult.data ?? []).length || row.periods || 0,
        totalStudents: new Set((enrollmentsResult.data ?? []).map((e: { student_profile_id: string }) => e.student_profile_id)).size,
        createdAt: row.created_at,
        externalLibraryId: row.external_library_id ?? undefined,
    }

    return mapped
}

export async function getCourseRecentActivityAdmin(courseId: string): Promise<CourseRecentActivityItem[]> {
    const [enrollmentsResult, linksResult, periodsResult] = await Promise.all([
        supabase
            .from("lxp_enrollments")
            .select("student_profile_id,created_at,lxp_profiles(name)")
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("lxp_course_library_links")
            .select(
                "id,library_content_name,linked_at,lxp_course_disciplines!inner(id,lxp_course_periods!inner(course_id))",
            )
            .eq("lxp_course_disciplines.lxp_course_periods.course_id", courseId)
            .order("linked_at", { ascending: false })
            .limit(5),
        supabase
            .from("lxp_course_periods")
            .select("id,name,created_at")
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })
            .limit(3),
    ])

    if (enrollmentsResult.error) throw enrollmentsResult.error
    if (linksResult.error) throw linksResult.error
    if (periodsResult.error) throw periodsResult.error

    const enrollmentEvents: CourseRecentActivityItem[] = (enrollmentsResult.data ?? []).map(
        (row: { student_profile_id: string; created_at: string; lxp_profiles: Array<{ name: string | null }> | null }) => ({
            id: `enrollment-${row.student_profile_id}-${row.created_at}`,
            action: "Novo aluno matriculado",
            actor: row.lxp_profiles?.[0]?.name ?? "Aluno",
            happenedAt: row.created_at,
        }),
    )

    const linkEvents: CourseRecentActivityItem[] = (linksResult.data ?? []).map(
        (row: { id: string; library_content_name: string | null; linked_at: string }) => ({
            id: `link-${row.id}`,
            action: `Conteúdo vinculado: ${row.library_content_name ?? "Conteúdo externo"}`,
            actor: "Admin",
            happenedAt: row.linked_at,
        }),
    )

    const periodEvents: CourseRecentActivityItem[] = (periodsResult.data ?? []).map(
        (row: { id: string; name: string; created_at: string }) => ({
            id: `period-${row.id}`,
            action: `Período criado: ${row.name}`,
            actor: "Admin",
            happenedAt: row.created_at,
        }),
    )

    return [...enrollmentEvents, ...linkEvents, ...periodEvents]
        .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime())
        .slice(0, 8)
}

export type UpsertCourseAdminPayload = {
    name: string
    description: string
    category: CourseAdmin["category"]
    status: CourseStatus
    periods: number
    externalLibraryId?: string
}

export async function createCourseAdmin(payload: UpsertCourseAdminPayload): Promise<void> {
    const normalizedPeriods = Math.max(1, Math.min(20, Math.trunc(payload.periods || 1)))

    const { data: createdCourse, error: courseError } = await supabase
        .from("lxp_courses")
        .insert({
            name: payload.name.trim(),
            description: payload.description.trim(),
            category: payload.category,
            status: payload.status,
            periods: normalizedPeriods,
            external_library_id: payload.externalLibraryId?.trim() || null,
        })
        .select("id")
        .single()

    if (courseError) throw courseError

    const courseId = (createdCourse as { id: string }).id
    const periodsToInsert = Array.from({ length: normalizedPeriods }, (_, idx) => ({
        course_id: courseId,
        number: idx + 1,
        name: `${idx + 1}º Período`,
        status: idx === 0 && payload.status === "active" ? "current" : "upcoming",
    }))

    const { error: periodsError } = await supabase.from("lxp_course_periods").insert(periodsToInsert)
    if (periodsError) throw periodsError
}

export async function updateCourseAdmin(
    courseId: string,
    payload: Pick<UpsertCourseAdminPayload, "name" | "description" | "category" | "status" | "externalLibraryId">,
): Promise<void> {
    const { error } = await supabase
        .from("lxp_courses")
        .update({
            name: payload.name.trim(),
            description: payload.description.trim(),
            category: payload.category,
            status: payload.status,
            external_library_id: payload.externalLibraryId?.trim() || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", courseId)
    if (error) throw error
}

export async function getCourseStudentsAdmin(courseId: string, courseName: string): Promise<{
    enrolledStudents: CourseStudentRow[]
    allStudents: StudentOption[]
}> {
    // 1) Buscar enrollments do curso
    const { data: enr, error: enrError } = await supabase
        .from("lxp_enrollments")
        .select("student_profile_id,status,created_at")
        .eq("course_id", courseId)

    if (enrError) throw enrError

    const enrolledProfileIds = Array.from(
        new Set((enr ?? []).map((e: { student_profile_id: string }) => e.student_profile_id)),
    )

    // 2) Buscar perfis (alunos) matriculados
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

    const enrolledRows: CourseStudentRow[] = enrolledProfiles.map((p) => {
        const enrInfo = enrMap.get(p.id)
        return {
            id: p.id,
            name: p.name ?? p.email ?? p.id,
            email: p.email ?? "",
            avatar: "/placeholder.svg",
            status: enrInfo?.status === "inactive" ? "inactive" : "active",
            lastAccess: p.updated_at ?? null,
            enrollments: [
                {
                    courseId,
                    courseName,
                    enrollmentDate: enrInfo?.created_at ?? new Date().toISOString(),
                    progress: 0,
                    status: (enrInfo?.status as CourseEnrollment["status"]) ?? "active",
                },
            ],
        }
    })

    // 3) Buscar todos os alunos (para o modal), com contagem de matrículas
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

    const options: StudentOption[] = (all ?? []).map((p: { id: string; name: string | null; email: string | null }) => ({
        id: p.id,
        name: p.name ?? p.email ?? p.id,
        email: p.email ?? "",
        avatar: "/placeholder.svg",
        status: "active",
        enrollmentCount: counts.get(p.id) ?? 0,
    }))

    return { enrolledStudents: enrolledRows, allStudents: options }
}

const ENROLLMENT_STATUS_MAP: Record<string, CourseEnrollment["status"]> = {
    active: "active",
    inactive: "inactive",
    blocked: "inactive",
    completed: "completed",
    cancelled: "cancelled",
}

function normalizeEnrollmentStatus(raw: string): CourseEnrollment["status"] {
    return ENROLLMENT_STATUS_MAP[raw] ?? "active"
}

function deriveStudentStatus(rawStatuses: string[]): "active" | "inactive" | "blocked" {
    if (rawStatuses.some((status) => status === "blocked")) return "blocked"
    if (rawStatuses.some((status) => status === "inactive")) return "inactive"
    return "active"
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

    const { data: periodsData, error: periodsError } =
        courseIds.length > 0
            ? await supabase.from("lxp_course_periods").select("id,course_id").in("course_id", courseIds)
            : { data: [], error: null }
    if (periodsError) throw periodsError

    const periodToCourse = new Map<string, string>()
    const discByCourse = new Map<string, string[]>()
    const periodRows = (periodsData ?? []) as Array<{ id: string; course_id: string }>
    for (const p of periodRows) {
        periodToCourse.set(p.id, p.course_id)
        if (!discByCourse.has(p.course_id)) discByCourse.set(p.course_id, [])
    }

    const periodIds = periodRows.map((p) => p.id)
    let disciplineRows: Array<{ id: string; course_period_id: string }> = []
    if (periodIds.length > 0) {
        const { data: dr, error: dErr } = await supabase
            .from("lxp_course_disciplines")
            .select("id,course_period_id")
            .in("course_period_id", periodIds)
        if (dErr) throw dErr
        disciplineRows = (dr ?? []) as typeof disciplineRows
    }

    for (const d of disciplineRows) {
        const cid = periodToCourse.get(d.course_period_id)
        if (!cid) continue
        if (!discByCourse.has(cid)) discByCourse.set(cid, [])
        discByCourse.get(cid)!.push(d.id)
    }

    const profileIds = (profiles ?? []).map((p: { id: string }) => p.id)
    const allDiscIds = [...new Set(disciplineRows.map((d) => d.id))]

    type ProgressRow = { student_profile_id: string; course_discipline_id: string; status: string }
    let progressRows: ProgressRow[] = []
    if (profileIds.length > 0 && allDiscIds.length > 0) {
        const { data: pr, error: prErr } = await supabase
            .from("lxp_student_discipline_progress")
            .select("student_profile_id,course_discipline_id,status")
            .in("student_profile_id", profileIds)
            .in("course_discipline_id", allDiscIds)
        if (prErr) throw prErr
        progressRows = (pr ?? []) as ProgressRow[]
    }

    const weights: Record<string, number> = {
        approved: 100,
        in_progress: 50,
        pending: 0,
        failed: 0,
    }

    const progressByKey = new Map<string, string>()
    for (const r of progressRows) {
        progressByKey.set(`${r.student_profile_id}:${r.course_discipline_id}`, r.status)
    }

    const progressForEnrollment = (studentId: string, courseId: string): number => {
        const discs = discByCourse.get(courseId) ?? []
        if (discs.length === 0) return 0
        let sum = 0
        for (const did of discs) {
            const st = progressByKey.get(`${studentId}:${did}`) ?? "pending"
            sum += weights[st] ?? 0
        }
        return Math.round(sum / discs.length)
    }

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

    return (profiles ?? []).map((p: {
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
            avatar: "/placeholder.svg",
            status: deriveStudentStatus(rawStatusByStudent.get(p.id) ?? []),
            lastAccess: p.updated_at,
            createdAt: p.created_at,
            phone: p.phone,
            birthDate: p.birth_date,
            enrollments,
        }
    })
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
}

export async function getCourseGradesAdmin(courseId: string): Promise<CoursePeriodAdmin[]> {
    const { data: periodsData, error: periodsError } = await supabase
        .from("lxp_course_periods")
        .select("id,course_id,number,name,status")
        .eq("course_id", courseId)
        .order("number", { ascending: true })

    if (periodsError) throw periodsError

    const periodRows = (periodsData ?? []) as Array<{
        id: string
        course_id: string
        number: number
        name: string
        status: "current" | "completed" | "upcoming"
    }>

    if (periodRows.length === 0) return []

    const periodIds = periodRows.map((p) => p.id)
    const { data: disciplinesData, error: disciplinesError } = await supabase
        .from("lxp_course_disciplines")
        .select("id,course_period_id,name,code,workload,credits,professor,status")
        .in("course_period_id", periodIds)
        .order("created_at", { ascending: true })

    if (disciplinesError) throw disciplinesError

    const disciplineRows = (disciplinesData ?? []) as Array<{
        id: string
        course_period_id: string
        name: string
        code: string
        workload: number
        credits: number
        professor: string | null
        status: "active" | "inactive"
    }>

    const disciplineIds = disciplineRows.map((d) => d.id)
    const linksByDisciplineId = new Map<string, { contentId?: string; contentName?: string }>()

    if (disciplineIds.length > 0) {
        const { data: linksData, error: linksError } = await supabase
            .from("lxp_course_library_links")
            .select("course_discipline_id,library_content_id,library_content_name,linked_at")
            .in("course_discipline_id", disciplineIds)
            .order("linked_at", { ascending: false })

        if (linksError) throw linksError

        ;(linksData ?? []).forEach(
            (link: {
                course_discipline_id: string
                library_content_id: string
                library_content_name: string | null
            }) => {
                if (linksByDisciplineId.has(link.course_discipline_id)) return
                linksByDisciplineId.set(link.course_discipline_id, {
                    contentId: link.library_content_id,
                    contentName: link.library_content_name ?? undefined,
                })
            },
        )
    }

    const disciplinesByPeriodId = new Map<string, CourseDisciplineAdmin[]>()
    disciplineRows.forEach((row) => {
        const arr = disciplinesByPeriodId.get(row.course_period_id) ?? []
        const link = linksByDisciplineId.get(row.id)
        arr.push({
            id: row.id,
            periodId: row.course_period_id,
            name: row.name,
            code: row.code,
            workload: row.workload ?? 0,
            credits: row.credits ?? 0,
            professor: row.professor ?? undefined,
            status: row.status ?? "active",
            linkedTrailId: link?.contentId,
            linkedTrailName: link?.contentName,
        })
        disciplinesByPeriodId.set(row.course_period_id, arr)
    })

    return periodRows.map((period) => ({
        id: period.id,
        courseId: period.course_id,
        number: period.number,
        name: period.name,
        status: period.status,
        disciplines: disciplinesByPeriodId.get(period.id) ?? [],
    }))
}

export async function createCoursePeriodAdmin(
    courseId: string,
    data: { name: string; status: "current" | "completed" | "upcoming" },
): Promise<void> {
    const { data: maxNumberData, error: maxNumberError } = await supabase
        .from("lxp_course_periods")
        .select("number")
        .eq("course_id", courseId)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (maxNumberError) throw maxNumberError

    const nextNumber = (maxNumberData?.number ?? 0) + 1

    const { error } = await supabase.from("lxp_course_periods").insert({
        course_id: courseId,
        name: data.name,
        status: data.status,
        number: nextNumber,
    })

    if (error) throw error
    await syncCoursePeriodsCount(courseId)
}

export async function updateCoursePeriodAdmin(
    periodId: string,
    data: { name: string; status: "current" | "completed" | "upcoming" },
): Promise<void> {
    const { error } = await supabase
        .from("lxp_course_periods")
        .update({
            name: data.name,
            status: data.status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", periodId)

    if (error) throw error
}

export async function deleteCoursePeriodAdmin(periodId: string): Promise<void> {
    const { data: period, error: getError } = await supabase
        .from("lxp_course_periods")
        .select("course_id")
        .eq("id", periodId)
        .maybeSingle()
    if (getError) throw getError

    const { error } = await supabase.from("lxp_course_periods").delete().eq("id", periodId)
    if (error) throw error
    if (period?.course_id) await syncCoursePeriodsCount(period.course_id)
}

export async function createCourseDisciplineAdmin(
    periodId: string,
    data: { name: string; code: string; workload: number; credits: number; professor?: string },
): Promise<void> {
    const { error } = await supabase.from("lxp_course_disciplines").insert({
        course_period_id: periodId,
        name: data.name,
        code: data.code,
        workload: data.workload,
        credits: data.credits,
        professor: data.professor ?? null,
        status: "active",
    })
    if (error) throw error
}

export async function updateCourseDisciplineAdmin(
    disciplineId: string,
    data: { name: string; code: string; workload: number; credits: number; professor?: string },
): Promise<void> {
    const { error } = await supabase
        .from("lxp_course_disciplines")
        .update({
            name: data.name,
            code: data.code,
            workload: data.workload,
            credits: data.credits,
            professor: data.professor ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", disciplineId)

    if (error) throw error
}

export async function deleteCourseDisciplineAdmin(disciplineId: string): Promise<void> {
    const { error } = await supabase.from("lxp_course_disciplines").delete().eq("id", disciplineId)
    if (error) throw error
}

export async function getCourseLinkedContentAdmin(courseId: string): Promise<CourseLinkedContentAdmin[]> {
    const { data, error } = await supabase
        .from("lxp_course_library_links")
        .select(
            "id,course_discipline_id,library_content_type,library_content_id,library_content_name,linked_at,linked_by,lxp_course_disciplines!inner(id,name,course_period_id,lxp_course_periods!inner(course_id))",
        )
        .eq("lxp_course_disciplines.lxp_course_periods.course_id", courseId)
        .eq("library_content_type", "discipline")
        .order("linked_at", { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as Array<{
        id: string
        course_discipline_id: string
        library_content_type: "discipline"
        library_content_id: string
        library_content_name: string | null
        linked_at: string
        linked_by: string | null
        lxp_course_disciplines:
            | {
                  id: string
                  name: string
                  course_period_id: string
                  lxp_course_periods: { course_id: string } | Array<{ course_id: string }>
              }
            | Array<{
                  id: string
                  name: string
                  course_period_id: string
                  lxp_course_periods: { course_id: string } | Array<{ course_id: string }>
              }>
        }>

    const linkedByIds = [...new Set(rows.map((row) => row.linked_by).filter((v): v is string => Boolean(v)))]
    const linkedByMap = new Map<string, string>()
    if (linkedByIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
            .from("backoffice_team_members")
            .select("user_id,name,email")
            .in("user_id", linkedByIds)
        if (membersError) throw membersError
        ;(membersData ?? []).forEach((m: { user_id: string; name: string | null; email: string | null }) => {
            linkedByMap.set(m.user_id, m.name ?? m.email ?? m.user_id)
        })
    }

    return rows.map((row) => {
        const disciplineRaw = Array.isArray(row.lxp_course_disciplines)
            ? row.lxp_course_disciplines[0]
            : row.lxp_course_disciplines
        const periodRaw = Array.isArray(disciplineRaw?.lxp_course_periods)
            ? disciplineRaw?.lxp_course_periods[0]
            : disciplineRaw?.lxp_course_periods
        return {
            id: row.id,
            courseId: periodRaw?.course_id ?? courseId,
            libraryContentId: row.library_content_id,
            libraryContentName: row.library_content_name ?? row.library_content_id,
            externalUrl: getLibraryDisciplineUrl(row.library_content_id),
            type: row.library_content_type,
            linkedAt: row.linked_at,
            linkedBy: row.linked_by ? linkedByMap.get(row.linked_by) ?? row.linked_by : "Sistema",
            disciplineId: disciplineRaw?.id,
            disciplineName: disciplineRaw?.name,
        }
    })
}

export async function linkCourseContentAdmin(
    data: {
        disciplineId: string
        libraryContentType: "discipline"
        libraryContentId: string
        libraryContentName?: string
    },
): Promise<void> {
    // Mantemos um único vínculo "discipline" por disciplina interna para evitar ambiguidades na jornada do aluno.
    const { error: cleanupError } = await supabase
        .from("lxp_course_library_links")
        .delete()
        .eq("course_discipline_id", data.disciplineId)
        .eq("library_content_type", "discipline")
    if (cleanupError) throw cleanupError

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("lxp_course_library_links").insert({
        course_discipline_id: data.disciplineId,
        library_content_type: data.libraryContentType,
        library_content_id: data.libraryContentId,
        library_content_name: data.libraryContentName ?? null,
        linked_by: user?.id ?? null,
    })
    if (error) throw error
}

export async function unlinkCourseContentAdmin(linkId: string): Promise<void> {
    const { error } = await supabase.from("lxp_course_library_links").delete().eq("id", linkId)
    if (error) throw error
}

async function syncCoursePeriodsCount(courseId: string): Promise<void> {
    const { data: periodsData, error: periodsError } = await supabase
        .from("lxp_course_periods")
        .select("id")
        .eq("course_id", courseId)
    if (periodsError) throw periodsError

    const { error: courseError } = await supabase
        .from("lxp_courses")
        .update({ periods: (periodsData ?? []).length, updated_at: new Date().toISOString() })
        .eq("id", courseId)
    if (courseError) throw courseError
}
