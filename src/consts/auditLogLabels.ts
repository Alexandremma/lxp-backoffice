import type { AuditLogRow } from "@/types/settings"

const ACTION_VERB: Record<string, string> = {
    "student.create": "cadastrou aluno",
    "student.profile_update": "atualizou aluno",
    "student.delete": "excluiu aluno",
    "student.block": "bloqueou aluno",
    "student.unblock": "desbloqueou aluno",
    "student.access_update": "alterou acesso do aluno",
    "student.reset_password": "solicitou redefinição de senha",
    "course.create": "criou curso",
    "course.update": "atualizou curso",
    "course.delete": "excluiu curso",
    "course.discipline.create": "criou disciplina",
    "course.discipline.update": "atualizou disciplina",
    "course.discipline.delete": "excluiu disciplina",
    "course.library.link": "vinculou biblioteca",
    "course.library.unlink": "desvinculou biblioteca",
    "enrollment.enroll": "matriculou aluno(s)",
    "enrollment.status_update": "alterou matrícula",
    "certificate.template.create": "criou template de certificado",
    "certificate.template.update": "atualizou template de certificado",
    "certificate.template.set_default": "definiu template padrão",
    "certificate.signature.create": "criou assinatura",
    "certificate.signature.update": "atualizou assinatura",
    "certificate.signature.delete": "excluiu assinatura",
    "gamification.xp_rule.update": "atualizou regra de XP",
    "gamification.badge.create": "criou badge",
    "gamification.badge.update": "atualizou badge",
    "gamification.badges.reevaluate_all": "reevaliou badges de todos os alunos",
    "institution.update": "atualizou dados da instituição",
    "smtp.update": "atualizou configurações de e-mail (SMTP)",
    "plan.upgrade_requested": "solicitou contato sobre upgrade de plano",
    "team.invite": "convidou membro da equipe",
    "team.invite_resend": "reenviou convite da equipe",
    "team.member_update": "atualizou membro da equipe",
    "team.member_delete": "removeu membro da equipe",
    "course.period.create": "criou período do curso",
    "course.period.update": "atualizou período do curso",
    "course.period.delete": "excluiu período do curso",
    "gamification.badge.delete": "excluiu badge",
    "certificate.template_signature.set": "definiu assinatura no template",
    "certificate.template_signature.remove": "removeu assinatura do template",
}

const ENTITY_LABEL: Record<string, string> = {
    lxp_profile: "Aluno",
    lxp_course: "Curso",
    lxp_course_discipline: "Disciplina",
    lxp_enrollment: "Matrícula",
    lxp_certificate_template: "Certificado",
    lxp_certificate_signature: "Assinatura",
    lxp_gamification_xp_rule: "Gamificação",
    lxp_gamification_badge: "Badge",
    institution_settings: "Instituição",
    subscription: "Plano",
    backoffice_team_member: "Equipe",
    lxp_course_period: "Período",
}

function metadataSummary(metadata: Record<string, unknown>): string {
    const parts: string[] = []
    if (typeof metadata.email === "string" && metadata.email) parts.push(metadata.email)
    if (typeof metadata.name === "string" && metadata.name) parts.push(metadata.name)
    if (typeof metadata.targetPlanName === "string") parts.push(`plano: ${metadata.targetPlanName}`)
    if (typeof metadata.courseId === "string") parts.push(`curso ${metadata.courseId.slice(0, 8)}…`)
    if (typeof metadata.students_processed === "number") parts.push(`${metadata.students_processed} alunos`)
    if (parts.length > 0) return parts.join(" · ")
    const keys = Object.keys(metadata)
    if (keys.length === 0) return ""
    return keys.slice(0, 3).join(", ")
}

export type AuditLogDisplay = {
    actorName: string
    verb: string
    resourceLabel: string
    detail: string
    action: string
}

export function formatAuditLogDisplay(row: AuditLogRow): AuditLogDisplay {
    const verb = ACTION_VERB[row.action] ?? row.action.split(".").join(" ")
    const resourceLabel = row.entity_type
        ? (ENTITY_LABEL[row.entity_type] ?? row.entity_type)
        : "Back Office"
    const metaDetail = metadataSummary(row.metadata ?? {})
    const entityBit = row.entity_id ? ` (${row.entity_id.slice(0, 8)}…)` : ""
    const detail = metaDetail || entityBit.trim() || "—"

    const metadataActorName =
        typeof row.metadata?.actor_member_name === "string"
            ? row.metadata.actor_member_name.trim()
            : ""

    return {
        actorName: row.actor_name?.trim() || metadataActorName || "Administrador",
        verb,
        resourceLabel,
        detail,
        action: row.action,
    }
}
