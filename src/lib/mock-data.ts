// ============================================
// MOCK DATA - LXP Admin Backoffice
// ============================================

// Current User (Admin mockado)
export const mockCurrentUser = {
  id: "usr_001",
  name: "Admin Master",
  email: "admin@lxp.edu.br",
  role: "admin" as const,
  avatar: "/placeholder.svg",
}

// Types
export type UserRole = "admin" | "coordinator" | "professor" | "support" | "student"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  status: "active" | "inactive" | "blocked"
  createdAt: string
}

export interface StudentEnrollment {
  courseId: string
  courseName: string
  enrollmentDate: string
  progress: number
  status: "active" | "inactive" | "completed" | "cancelled"
}

export interface Student extends User {
  role: "student"
  enrollments: StudentEnrollment[]
  lastAccess: string
}

export type TeamRole = "admin" | "coordinator" | "secretary" | "professor" | "tutor" | "financial" | "commercial"

export interface TeamMember extends Omit<User, "role"> {
  role: TeamRole
  department?: string
  courses?: string[]
}

export interface Course {
  id: string
  name: string
  description: string
  category: "graduation" | "postgraduate" | "extension"
  status: "draft" | "active" | "archived"
  periods: number
  totalStudents: number
  createdAt: string
  externalLibraryId?: string
}


// Students
export const mockStudents: Student[] = [
  {
    id: "std_001",
    name: "Maria Silva Santos",
    email: "maria.silva@email.com",
    role: "student",
    status: "active",
    enrollments: [
      { courseId: "crs_001", courseName: "Administração de Empresas", enrollmentDate: "2024-02-15", progress: 65, status: "active" },
      { courseId: "crs_004", courseName: "MBA em Gestão de Projetos", enrollmentDate: "2024-06-01", progress: 30, status: "active" },
    ],
    lastAccess: "2025-01-25T14:30:00",
    createdAt: "2024-02-15",
  },
  {
    id: "std_002",
    name: "João Pedro Oliveira",
    email: "joao.oliveira@email.com",
    role: "student",
    status: "active",
    enrollments: [
      { courseId: "crs_002", courseName: "Direito", enrollmentDate: "2024-03-01", progress: 42, status: "active" },
    ],
    lastAccess: "2025-01-24T09:15:00",
    createdAt: "2024-03-01",
  },
  {
    id: "std_003",
    name: "Ana Carolina Mendes",
    email: "ana.mendes@email.com",
    role: "student",
    status: "active",
    enrollments: [
      { courseId: "crs_001", courseName: "Administração de Empresas", enrollmentDate: "2024-01-20", progress: 88, status: "active" },
      { courseId: "crs_003", courseName: "Engenharia Civil", enrollmentDate: "2024-08-10", progress: 15, status: "active" },
    ],
    lastAccess: "2025-01-26T08:45:00",
    createdAt: "2024-01-20",
  },
  {
    id: "std_004",
    name: "Lucas Ferreira Costa",
    email: "lucas.costa@email.com",
    role: "student",
    status: "inactive",
    enrollments: [
      { courseId: "crs_003", courseName: "Engenharia Civil", enrollmentDate: "2023-08-10", progress: 30, status: "inactive" },
    ],
    lastAccess: "2024-12-15T16:20:00",
    createdAt: "2023-08-10",
  },
  {
    id: "std_005",
    name: "Beatriz Lima Rodrigues",
    email: "beatriz.rodrigues@email.com",
    role: "student",
    status: "blocked",
    enrollments: [
      { courseId: "crs_002", courseName: "Direito", enrollmentDate: "2024-02-01", progress: 15, status: "inactive" },
    ],
    lastAccess: "2024-11-20T11:00:00",
    createdAt: "2024-02-01",
  },
]

// Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    id: "team_001",
    name: "Rodrigo Martins Silva",
    email: "rodrigo.martins@lxp.edu.br",
    role: "admin",
    status: "active",
    department: "Tecnologia",
    createdAt: "2021-01-10",
  },
  {
    id: "team_002",
    name: "Prof. Dr. Carlos Eduardo",
    email: "carlos.eduardo@lxp.edu.br",
    role: "coordinator",
    status: "active",
    department: "Administração",
    courses: ["crs_001"],
    createdAt: "2022-01-15",
  },
  {
    id: "team_003",
    name: "Patrícia Oliveira Santos",
    email: "patricia.santos@lxp.edu.br",
    role: "secretary",
    status: "active",
    department: "Secretaria Acadêmica",
    createdAt: "2022-05-20",
  },
  {
    id: "team_004",
    name: "Profa. Dra. Fernanda Alves",
    email: "fernanda.alves@lxp.edu.br",
    role: "professor",
    status: "active",
    department: "Direito",
    courses: ["crs_002"],
    createdAt: "2022-03-20",
  },
  {
    id: "team_005",
    name: "Ricardo Souza Lima",
    email: "ricardo.lima@lxp.edu.br",
    role: "tutor",
    status: "active",
    department: "Suporte Acadêmico",
    courses: ["crs_001", "crs_002"],
    createdAt: "2023-02-15",
  },
  {
    id: "team_006",
    name: "Amanda Costa Ferreira",
    email: "amanda.ferreira@lxp.edu.br",
    role: "financial",
    status: "active",
    department: "Financeiro",
    createdAt: "2022-08-10",
  },
  {
    id: "team_007",
    name: "Bruno Henrique Dias",
    email: "bruno.dias@lxp.edu.br",
    role: "commercial",
    status: "active",
    department: "Comercial",
    createdAt: "2023-04-01",
  },
]

// Courses
export const mockCourses: Course[] = [
  {
    id: "crs_001",
    name: "Administração de Empresas",
    description: "Curso de graduação em Administração com foco em gestão empresarial",
    category: "graduation",
    status: "active",
    periods: 8,
    totalStudents: 450,
    createdAt: "2022-01-01",
    externalLibraryId: "lib_adm_001",
  },
  {
    id: "crs_002",
    name: "Direito",
    description: "Curso de graduação em Direito",
    category: "graduation",
    status: "active",
    periods: 10,
    totalStudents: 380,
    createdAt: "2022-01-01",
    externalLibraryId: "lib_dir_001",
  },
  {
    id: "crs_003",
    name: "Engenharia Civil",
    description: "Curso de graduação em Engenharia Civil",
    category: "graduation",
    status: "active",
    periods: 10,
    totalStudents: 290,
    createdAt: "2022-01-01",
  },
  {
    id: "crs_004",
    name: "MBA em Gestão de Projetos",
    description: "Pós-graduação em Gestão de Projetos com certificação PMI",
    category: "postgraduate",
    status: "active",
    periods: 4,
    totalStudents: 120,
    createdAt: "2023-06-01",
    externalLibraryId: "lib_mba_001",
  },
  {
    id: "crs_005",
    name: "Especialização em IA",
    description: "Curso de extensão em Inteligência Artificial",
    category: "extension",
    status: "draft",
    periods: 2,
    totalStudents: 0,
    createdAt: "2025-01-10",
  },
]

// ============================================
// PHASE 4: Academic Management - Extended Mock Data
// ============================================

// External Library Content (simulated external API content)
export interface LibraryContent {
  id: string
  name: string
  type: "trail" | "module" | "lesson"
  description: string
  duration: string
  lessonsCount?: number
  modulesCount?: number
  thumbnail?: string
  tags: string[]
  createdAt: string
}

export const mockLibraryContent: LibraryContent[] = [
  {
    id: "lib_001",
    name: "Fundamentos de Gestão Empresarial",
    type: "trail",
    description: "Trilha completa sobre princípios de gestão, liderança e tomada de decisão",
    duration: "18h",
    modulesCount: 6,
    lessonsCount: 32,
    tags: ["gestão", "liderança", "estratégia"],
    createdAt: "2024-06-15",
  },
  {
    id: "lib_002",
    name: "Marketing Digital Avançado",
    type: "trail",
    description: "Estratégias de marketing digital, SEO, mídias sociais e analytics",
    duration: "24h",
    modulesCount: 8,
    lessonsCount: 48,
    tags: ["marketing", "digital", "SEO"],
    createdAt: "2024-07-20",
  },
  {
    id: "lib_003",
    name: "Direito Constitucional Brasileiro",
    type: "trail",
    description: "Estudo aprofundado da Constituição Federal e seus princípios",
    duration: "32h",
    modulesCount: 10,
    lessonsCount: 60,
    tags: ["direito", "constitucional", "legislação"],
    createdAt: "2024-05-10",
  },
  {
    id: "lib_004",
    name: "Cálculo Estrutural para Engenharia",
    type: "trail",
    description: "Fundamentos de cálculo estrutural e análise de estruturas",
    duration: "40h",
    modulesCount: 12,
    lessonsCount: 72,
    tags: ["engenharia", "cálculo", "estruturas"],
    createdAt: "2024-04-25",
  },
  {
    id: "lib_005",
    name: "Introdução à Inteligência Artificial",
    type: "module",
    description: "Conceitos básicos de IA, machine learning e deep learning",
    duration: "8h",
    lessonsCount: 12,
    tags: ["IA", "machine learning", "tecnologia"],
    createdAt: "2024-08-01",
  },
  {
    id: "lib_006",
    name: "Finanças Corporativas",
    type: "trail",
    description: "Gestão financeira, análise de investimentos e valuation",
    duration: "20h",
    modulesCount: 6,
    lessonsCount: 28,
    tags: ["finanças", "investimentos", "corporativo"],
    createdAt: "2024-03-15",
  },
  {
    id: "lib_007",
    name: "Gestão de Projetos PMI",
    type: "trail",
    description: "Metodologias PMI, PMBOK e certificação PMP",
    duration: "36h",
    modulesCount: 10,
    lessonsCount: 55,
    tags: ["projetos", "PMI", "gestão"],
    createdAt: "2024-02-20",
  },
  {
    id: "lib_008",
    name: "Contabilidade Básica",
    type: "module",
    description: "Princípios contábeis, balanço patrimonial e DRE",
    duration: "6h",
    lessonsCount: 10,
    tags: ["contabilidade", "finanças", "básico"],
    createdAt: "2024-09-05",
  },
]

// Course Periods and Disciplines
export interface Discipline {
  id: string
  name: string
  code: string
  workload: number // in hours
  linkedTrailId?: string
  linkedTrailName?: string
  professor?: string
  status: "active" | "inactive"
}

export interface CourseGrade {
  id: string
  courseId: string
  name: string
  number: number
  disciplines: Discipline[]
  status: "current" | "completed" | "upcoming"
}

export const mockCourseGrades: CourseGrade[] = [
  {
    id: "per_001",
    courseId: "crs_001",
    name: "1ª Grade",
    number: 1,
    status: "completed",
    disciplines: [
      {
        id: "disc_001",
        name: "Introdução à Administração",
        code: "ADM101",
        workload: 60,
        linkedTrailId: "lib_001",
        linkedTrailName: "Fundamentos de Gestão Empresarial",
        professor: "Prof. Dr. Carlos Eduardo",
        status: "active",
      },
      {
        id: "disc_002",
        name: "Matemática Aplicada",
        code: "MAT101",
        workload: 80,
        status: "active",
      },
      {
        id: "disc_003",
        name: "Comunicação Empresarial",
        code: "COM101",
        workload: 40,
        professor: "Profa. Maria Santos",
        status: "active",
      },
    ],
  },
  {
    id: "per_002",
    courseId: "crs_001",
    name: "2ª Grade",
    number: 2,
    status: "current",
    disciplines: [
      {
        id: "disc_004",
        name: "Contabilidade Geral",
        code: "CTB201",
        workload: 60,
        linkedTrailId: "lib_008",
        linkedTrailName: "Contabilidade Básica",
        status: "active",
      },
      {
        id: "disc_005",
        name: "Economia",
        code: "ECO201",
        workload: 60,
        status: "active",
      },
      {
        id: "disc_006",
        name: "Marketing",
        code: "MKT201",
        workload: 60,
        linkedTrailId: "lib_002",
        linkedTrailName: "Marketing Digital Avançado",
        professor: "Prof. João Silva",
        status: "active",
      },
    ],
  },
  {
    id: "per_003",
    courseId: "crs_001",
    name: "3ª Grade",
    number: 3,
    status: "upcoming",
    disciplines: [
      {
        id: "disc_007",
        name: "Gestão de Pessoas",
        code: "RH301",
        workload: 60,
        status: "active",
      },
      {
        id: "disc_008",
        name: "Finanças Empresariais",
        code: "FIN301",
        workload: 80,
        linkedTrailId: "lib_006",
        linkedTrailName: "Finanças Corporativas",
        status: "active",
      },
    ],
  },
  {
    id: "per_004",
    courseId: "crs_002",
    name: "1ª Grade",
    number: 1,
    status: "completed",
    disciplines: [
      {
        id: "disc_009",
        name: "Teoria do Direito",
        code: "DIR101",
        workload: 60,
        status: "active",
      },
      {
        id: "disc_010",
        name: "Direito Constitucional I",
        code: "DIR102",
        workload: 80,
        linkedTrailId: "lib_003",
        linkedTrailName: "Direito Constitucional Brasileiro",
        status: "active",
      },
    ],
  },
]

// Linked Content for Courses
export interface CourseLinkedContent {
  id: string
  courseId: string
  libraryContentId: string
  libraryContentName: string
  type: "trail" | "module"
  linkedAt: string
  linkedBy: string
  disciplineId?: string
  disciplineName?: string
}

export const mockCourseLinkedContent: CourseLinkedContent[] = [
  {
    id: "link_001",
    courseId: "crs_001",
    libraryContentId: "lib_001",
    libraryContentName: "Fundamentos de Gestão Empresarial",
    type: "trail",
    linkedAt: "2024-06-20",
    linkedBy: "Admin Master",
    disciplineId: "disc_001",
    disciplineName: "Introdução à Administração",
  },
  {
    id: "link_002",
    courseId: "crs_001",
    libraryContentId: "lib_002",
    libraryContentName: "Marketing Digital Avançado",
    type: "trail",
    linkedAt: "2024-07-25",
    linkedBy: "Prof. Dr. Carlos Eduardo",
    disciplineId: "disc_006",
    disciplineName: "Marketing",
  },
  {
    id: "link_003",
    courseId: "crs_002",
    libraryContentId: "lib_003",
    libraryContentName: "Direito Constitucional Brasileiro",
    type: "trail",
    linkedAt: "2024-05-15",
    linkedBy: "Admin Master",
    disciplineId: "disc_010",
    disciplineName: "Direito Constitucional I",
  },
]


// Student Financial Data
export interface StudentFinancial {
  studentId: string
  totalDue: number
  totalPaid: number
  nextDueDate: string
  status: "regular" | "late" | "blocked"
  installments: {
    id: string
    description: string
    amount: number
    dueDate: string
    paidAt?: string
    status: "paid" | "pending" | "overdue"
  }[]
}

export const mockStudentFinancial: Record<string, StudentFinancial> = {
  std_001: {
    studentId: "std_001",
    totalDue: 12000,
    totalPaid: 8000,
    nextDueDate: "2025-02-10",
    status: "regular",
    installments: [
      { id: "inst_001", description: "Mensalidade Janeiro/2025", amount: 1500, dueDate: "2025-01-10", paidAt: "2025-01-08", status: "paid" },
      { id: "inst_002", description: "Mensalidade Fevereiro/2025", amount: 1500, dueDate: "2025-02-10", status: "pending" },
      { id: "inst_003", description: "Mensalidade Março/2025", amount: 1500, dueDate: "2025-03-10", status: "pending" },
    ],
  },
  std_005: {
    studentId: "std_005",
    totalDue: 12000,
    totalPaid: 3000,
    nextDueDate: "2024-11-10",
    status: "blocked",
    installments: [
      { id: "inst_004", description: "Mensalidade Novembro/2024", amount: 1500, dueDate: "2024-11-10", status: "overdue" },
      { id: "inst_005", description: "Mensalidade Dezembro/2024", amount: 1500, dueDate: "2024-12-10", status: "overdue" },
      { id: "inst_006", description: "Mensalidade Janeiro/2025", amount: 1500, dueDate: "2025-01-10", status: "overdue" },
    ],
  },
}

// Student Access History
export interface StudentAccessLog {
  id: string
  studentId: string
  action: "login" | "lesson_view" | "quiz_start" | "quiz_submit" | "download" | "logout"
  description: string
  timestamp: string
  metadata?: {
    lessonId?: string
    lessonName?: string
    quizId?: string
    quizName?: string
    fileId?: string
    fileName?: string
  }
}

export const mockStudentHistory: Record<string, StudentAccessLog[]> = {
  std_001: [
    { id: "log_001", studentId: "std_001", action: "login", description: "Login realizado", timestamp: "2025-01-25T14:30:00" },
    { id: "log_002", studentId: "std_001", action: "lesson_view", description: "Visualizou aula: Introdução à Gestão", timestamp: "2025-01-25T14:35:00", metadata: { lessonId: "lesson_001", lessonName: "Introdução à Gestão" } },
    { id: "log_003", studentId: "std_001", action: "quiz_start", description: "Iniciou quiz: Fundamentos de Gestão", timestamp: "2025-01-25T15:00:00", metadata: { quizId: "quiz_001", quizName: "Fundamentos de Gestão" } },
    { id: "log_004", studentId: "std_001", action: "quiz_submit", description: "Submeteu quiz: Fundamentos de Gestão", timestamp: "2025-01-25T15:25:00", metadata: { quizId: "quiz_001", quizName: "Fundamentos de Gestão" } },
    { id: "log_005", studentId: "std_001", action: "logout", description: "Logout realizado", timestamp: "2025-01-25T16:00:00" },
  ],
}

// ============================================
// PHASE 6: Secretaria
// ============================================

// Document Requests
export interface DocumentRequest {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  documentType: string
  status: "pending" | "processing" | "ready" | "delivered" | "rejected"
  requestDate: string
  completedAt?: string
  notes?: string
}

export const mockDocumentRequests: DocumentRequest[] = [
  {
    id: "doc_001",
    studentId: "std_001",
    studentName: "Maria Silva Santos",
    studentEmail: "maria.silva@email.com",
    documentType: "Histórico Escolar",
    status: "pending",
    requestDate: "2025-01-25",
  },
  {
    id: "doc_002",
    studentId: "std_002",
    studentName: "João Pedro Oliveira",
    studentEmail: "joao.oliveira@email.com",
    documentType: "Declaração de Matrícula",
    status: "ready",
    requestDate: "2025-01-20",
    completedAt: "2025-01-22",
  },
  {
    id: "doc_003",
    studentId: "std_003",
    studentName: "Ana Carolina Mendes",
    studentEmail: "ana.mendes@email.com",
    documentType: "Atestado de Frequência",
    status: "processing",
    requestDate: "2025-01-24",
  },
  {
    id: "doc_004",
    studentId: "std_004",
    studentName: "Lucas Ferreira Costa",
    studentEmail: "lucas.costa@email.com",
    documentType: "Histórico Escolar",
    status: "delivered",
    requestDate: "2025-01-15",
    completedAt: "2025-01-18",
  },
  {
    id: "doc_005",
    studentId: "std_005",
    studentName: "Beatriz Lima Rodrigues",
    studentEmail: "beatriz.rodrigues@email.com",
    documentType: "Comprovante de Conclusão",
    status: "rejected",
    requestDate: "2025-01-22",
    notes: "Aluno não concluiu o curso",
  },
]

// Enrollments
export interface EnrollmentQueueItem {
  id: string
  studentName: string
  email: string
  courseName: string
  type: "new" | "reenrollment"
  status: "pending" | "approved" | "rejected" | "waiting_payment"
  requestDate: string
}

export const mockEnrollmentQueue: EnrollmentQueueItem[] = [
  {
    id: "eq_001",
    studentName: "Pedro Henrique Silva",
    email: "pedro.silva@email.com",
    courseName: "Administração de Empresas",
    type: "new",
    status: "pending",
    requestDate: "2025-01-25",
  },
  {
    id: "eq_002",
    studentName: "Juliana Martins",
    email: "juliana.martins@email.com",
    courseName: "Direito",
    type: "new",
    status: "waiting_payment",
    requestDate: "2025-01-24",
  },
  {
    id: "eq_003",
    studentName: "Maria Silva Santos",
    email: "maria.silva@email.com",
    courseName: "Administração de Empresas",
    type: "reenrollment",
    status: "approved",
    requestDate: "2025-01-20",
  },
  {
    id: "eq_004",
    studentName: "Rafael Oliveira",
    email: "rafael.oliveira@email.com",
    courseName: "Engenharia Civil",
    type: "reenrollment",
    status: "pending",
    requestDate: "2025-01-26",
  },
]

// ============================================
// PHASE 8: Configurations
// ============================================

// Gamification (types live in @/types/gamification)
export type {
  XPAction,
  BadgeTriggerType,
  BadgeOperator,
  BadgeRule,
  BadgeRuleConfig,
  GamificationBadge,
  GamificationLevel,
} from "@/types/gamification"

import type { GamificationBadge, GamificationLevel, XPAction } from "@/types/gamification"

export const mockXPConfig: XPAction[] = [
  { id: "xp_001", name: "Aula Assistida", description: "Completar uma aula/vídeo", xpValue: 10, category: "lesson", enabled: true },
  { id: "xp_002", name: "Quiz Completado", description: "Finalizar um quiz", xpValue: 25, category: "quiz", enabled: true },
  { id: "xp_003", name: "Nota Máxima", description: "Obter nota máxima em avaliação", xpValue: 50, category: "quiz", enabled: true },
  { id: "xp_004", name: "Acesso Diário", description: "Fazer login no dia", xpValue: 5, category: "engagement", enabled: true },
  { id: "xp_005", name: "Sequência 7 Dias", description: "Acessar 7 dias seguidos", xpValue: 100, category: "engagement", enabled: true },
  { id: "xp_006", name: "Comentário no Fórum", description: "Participar em discussões", xpValue: 15, category: "social", enabled: true },
  { id: "xp_007", name: "Ajudar Colega", description: "Resposta marcada como útil", xpValue: 30, category: "social", enabled: true },
]

export const mockBadges: GamificationBadge[] = [
  { 
    id: "badge_001", 
    name: "Lenda Acadêmica", 
    description: "Completou todas as trilhas disponíveis com excelência", 
    icon: "award", 
    condition: "Cursos finalizados >= 10", 
    rarity: "legendary", 
    earnedCount: 12, 
    xpReward: 1000,
    ruleConfig: {
      rules: [{ id: "r1", trigger: "courses_completed", operator: "gte", value: 10 }],
      matchMode: "all"
    }
  },
  { 
    id: "badge_002", 
    name: "Top 10% da Turma", 
    description: "Entre os melhores alunos do semestre", 
    icon: "trophy", 
    condition: "Nível atingido >= 10 E XP acumulado >= 5000", 
    rarity: "epic", 
    earnedCount: 89, 
    xpReward: 300,
    ruleConfig: {
      rules: [
        { id: "r1", trigger: "level_reached", operator: "gte", value: 10 },
        { id: "r2", trigger: "xp_earned", operator: "gte", value: 5000 }
      ],
      matchMode: "all"
    }
  },
  { 
    id: "badge_003", 
    name: "Maratonista", 
    description: "Completou 10 aulas em um único dia", 
    icon: "zap", 
    condition: "Aulas completadas >= 10", 
    rarity: "rare", 
    earnedCount: 342, 
    xpReward: 150,
    ruleConfig: {
      rules: [{ id: "r1", trigger: "lessons_completed", operator: "gte", value: 10 }],
      matchMode: "all"
    }
  },
  { 
    id: "badge_004", 
    name: "Streak de 7 Dias", 
    description: "Estudou por 7 dias consecutivos sem parar", 
    icon: "flame", 
    condition: "Dias consecutivos >= 7", 
    rarity: "rare", 
    earnedCount: 567, 
    xpReward: 100,
    ruleConfig: {
      rules: [{ id: "r1", trigger: "streak_days", operator: "gte", value: 7 }],
      matchMode: "all"
    }
  },
  { 
    id: "badge_005", 
    name: "Colaborador", 
    description: "Ajudou 5 colegas no fórum de discussão", 
    icon: "users", 
    condition: "Respostas no fórum >= 5", 
    rarity: "rare", 
    earnedCount: 234, 
    xpReward: 75,
    ruleConfig: {
      rules: [{ id: "r1", trigger: "forum_replies", operator: "gte", value: 5 }],
      matchMode: "all"
    }
  },
  { 
    id: "badge_006", 
    name: "Primeiro Projeto", 
    description: "Conquistado ao entregar seu primeiro projeto na plataforma", 
    icon: "rocket", 
    condition: "Primeiro acesso", 
    rarity: "common", 
    earnedCount: 1890, 
    xpReward: 50,
    ruleConfig: {
      rules: [{ id: "r1", trigger: "first_login", operator: "eq", value: true }],
      matchMode: "all"
    }
  },
]

export const mockLevels: GamificationLevel[] = [
  { level: 1, name: "Iniciante", xpRequired: 0 },
  { level: 2, name: "Aprendiz", xpRequired: 100 },
  { level: 3, name: "Estudante", xpRequired: 300 },
  { level: 4, name: "Dedicado", xpRequired: 600 },
  { level: 5, name: "Avançado", xpRequired: 1000 },
  { level: 6, name: "Especialista", xpRequired: 1500 },
  { level: 7, name: "Mestre", xpRequired: 2500 },
  { level: 8, name: "Grão-Mestre", xpRequired: 4000 },
  { level: 9, name: "Lenda", xpRequired: 6000 },
  { level: 10, name: "Iluminado", xpRequired: 10000 },
]

// Certificates
export interface CertificateTemplate {
  id: string
  name: string
  type: "completion" | "participation" | "excellence"
  description: string
  active: boolean
}

export const mockCertificateTemplates: CertificateTemplate[] = [
  { id: "cert_001", name: "Certificado de Conclusão", type: "completion", description: "Emitido ao concluir 100% do curso", active: true },
  { id: "cert_002", name: "Certificado de Participação", type: "participation", description: "Emitido para eventos e workshops", active: true },
  { id: "cert_003", name: "Certificado de Excelência", type: "excellence", description: "Emitido para notas acima de 9.0", active: true },
]

export interface CertificateEmission {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseName: string
  templateId: string
  templateName: string
  issuedAt: string
  validationCode: string
}

export const mockCertificateEmissions: CertificateEmission[] = [
  { id: "em_001", studentId: "std_001", studentName: "Maria Silva Santos", courseId: "crs_001", courseName: "Administração", templateId: "cert_001", templateName: "Conclusão", issuedAt: "2025-01-20", validationCode: "CERT-2025-001" },
  { id: "em_002", studentId: "std_003", studentName: "Ana Carolina Mendes", courseId: "crs_001", courseName: "Administração", templateId: "cert_003", templateName: "Excelência", issuedAt: "2025-01-18", validationCode: "CERT-2025-002" },
  { id: "em_003", studentId: "std_002", studentName: "João Pedro Oliveira", courseId: "crs_002", courseName: "Direito", templateId: "cert_002", templateName: "Participação", issuedAt: "2025-01-15", validationCode: "CERT-2025-003" },
]

export interface CertificateSignature {
  id: string
  name: string
  title: string
  active: boolean
}

export const mockSignatures: CertificateSignature[] = [
  { id: "sig_001", name: "Dr. Roberto Carlos Mendes", title: "Reitor", active: true },
  { id: "sig_002", name: "Dra. Márcia Helena Souza", title: "Pró-Reitora Acadêmica", active: true },
  { id: "sig_003", name: "Dr. Paulo Ricardo Lima", title: "Coordenador de Curso", active: false },
]

// Settings
export const mockInstitutionSettings = {
  name: "Universidade LXP",
  cnpj: "12.345.678/0001-99",
  email: "contato@lxp.edu.br",
  phone: "(11) 3456-7890",
  address: "Av. Paulista, 1000 - São Paulo, SP - CEP 01310-100",
  smtp: {
    host: "smtp.lxp.edu.br",
    port: "587",
    user: "noreply@lxp.edu.br",
    password: "********",
    secure: true,
  },
}

/** @deprecated Use `PLAN_CATALOG` em `@/consts/planCatalog`. */
export type SubscriptionPlan = import("@/consts/planCatalog").SubscriptionPlanCatalogItem

/** @deprecated Use `PLAN_CATALOG` em `@/consts/planCatalog`. */
export { PLAN_CATALOG as mockSubscriptionPlans } from "@/consts/planCatalog"

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: "create" | "update" | "delete" | "view"
  resource: string
  details: string
  timestamp: string
}

/** Mock — substituir por `lxp_audit_logs` (Fase 4). Escopo: ações no Back Office apenas. */
export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit_001",
    userId: "usr_001",
    userName: "Admin Master",
    action: "create",
    resource: "Aluno",
    details: "Cadastrou aluno alexandremm.1118@gmail.com",
    timestamp: "2026-05-28T10:30:00",
  },
  {
    id: "audit_002",
    userId: "usr_001",
    userName: "Admin Master",
    action: "update",
    resource: "Disciplina",
    details: "Vinculou biblioteca externa à disciplina 'APIs e Integrações'",
    timestamp: "2026-05-28T09:15:00",
  },
  {
    id: "audit_003",
    userId: "usr_001",
    userName: "Admin Master",
    action: "update",
    resource: "Certificado",
    details: "Atualizou template padrão de certificado (logo institucional)",
    timestamp: "2026-05-27T16:45:00",
  },
  {
    id: "audit_004",
    userId: "team_002",
    userName: "Coordenação Acadêmica",
    action: "update",
    resource: "Gamificação",
    details: "Alterou regra de XP 'Aula Assistida' para +10",
    timestamp: "2026-05-27T14:00:00",
  },
  {
    id: "audit_005",
    userId: "usr_001",
    userName: "Admin Master",
    action: "create",
    resource: "Badge",
    details: "Criou badge 'Explorador' (≥ 1 comentário na aula)",
    timestamp: "2026-05-26T11:30:00",
  },
  {
    id: "audit_006",
    userId: "usr_001",
    userName: "Admin Master",
    action: "update",
    resource: "Aluno",
    details: "Bloqueou matrícula do aluno student@lxp.edu.br",
    timestamp: "2026-05-26T08:20:00",
  },
]

// ============================================
// Team Member Actions & Permissions
// ============================================

export interface TeamMemberAction {
  id: string
  memberId: string
  action: string
  description: string
  timestamp: string
}

export const mockTeamMemberActions: Record<string, TeamMemberAction[]> = {
  team_001: [
    { id: "act_001", memberId: "team_001", action: "login", description: "Login no sistema", timestamp: "2025-01-26T08:30:00" },
    { id: "act_002", memberId: "team_001", action: "config_update", description: "Atualizou configurações do AI Tutor", timestamp: "2025-01-25T14:20:00" },
    { id: "act_003", memberId: "team_001", action: "user_create", description: "Criou novo usuário", timestamp: "2025-01-24T10:00:00" },
  ],
  team_002: [
    { id: "act_004", memberId: "team_002", action: "login", description: "Login no sistema", timestamp: "2025-01-26T07:45:00" },
    { id: "act_005", memberId: "team_002", action: "course_update", description: "Atualizou grade curricular", timestamp: "2025-01-25T16:30:00" },
  ],
  team_003: [
    { id: "act_006", memberId: "team_003", action: "login", description: "Login no sistema", timestamp: "2025-01-26T08:00:00" },
    { id: "act_007", memberId: "team_003", action: "ticket_resolve", description: "Resolveu ticket #002", timestamp: "2025-01-25T09:00:00" },
    { id: "act_008", memberId: "team_003", action: "document_emit", description: "Emitiu declaração de matrícula", timestamp: "2025-01-24T15:00:00" },
  ],
  team_004: [
    { id: "act_009", memberId: "team_004", action: "login", description: "Login no sistema", timestamp: "2025-01-26T09:00:00" },
    { id: "act_010", memberId: "team_004", action: "content_create", description: "Publicou nova aula", timestamp: "2025-01-25T11:00:00" },
  ],
  team_005: [
    { id: "act_011", memberId: "team_005", action: "login", description: "Login no sistema", timestamp: "2025-01-26T08:15:00" },
    { id: "act_012", memberId: "team_005", action: "ticket_reply", description: "Respondeu ticket de suporte", timestamp: "2025-01-25T10:30:00" },
    { id: "act_013", memberId: "team_005", action: "student_chat", description: "Atendeu aluno via chat", timestamp: "2025-01-24T14:00:00" },
  ],
  team_006: [
    { id: "act_014", memberId: "team_006", action: "login", description: "Login no sistema", timestamp: "2025-01-26T08:45:00" },
    { id: "act_015", memberId: "team_006", action: "invoice_generate", description: "Gerou boletos do mês", timestamp: "2025-01-25T09:00:00" },
  ],
  team_007: [
    { id: "act_016", memberId: "team_007", action: "login", description: "Login no sistema", timestamp: "2025-01-26T09:30:00" },
    { id: "act_017", memberId: "team_007", action: "lead_contact", description: "Contatou 15 leads", timestamp: "2025-01-25T14:00:00" },
  ],
}

export const rolePermissions: Record<TeamRole, string[]> = {
  admin: ["Acesso total", "Gerenciar usuários", "Configurações do sistema", "Relatórios financeiros", "Logs de auditoria"],
  coordinator: ["Gerenciar cursos", "Gerenciar professores", "Relatórios acadêmicos", "Aprovar matrículas", "Definir grade curricular"],
  secretary: ["Gerenciar alunos", "Emitir documentos", "Gerenciar matrículas", "Atender tickets", "Visualizar relatórios"],
  professor: ["Criar conteúdo", "Avaliar alunos", "Visualizar turmas", "Fórum de discussão", "Lançar notas"],
  tutor: ["Responder tickets", "Suporte ao aluno", "Chat com alunos", "Monitorar progresso", "Relatórios de atendimento"],
  financial: ["Faturamento", "Cobranças", "Relatórios financeiros", "Gerenciar boletos", "Fluxo de caixa"],
  commercial: ["Leads e prospects", "Campanhas", "Relatórios comerciais", "Promoções", "Funil de vendas"],
}
