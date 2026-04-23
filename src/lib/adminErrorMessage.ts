type AdminErrorContext =
    | "team-save"
    | "team-delete"
    | "students-update-profile"
    | "students-list"
    | "team-list"

function getErrorCode(err: unknown): string {
    if (typeof err === "object" && err !== null && "code" in err) {
        return String((err as { code?: string }).code ?? "")
    }
    return ""
}

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message
    return ""
}

export function getAdminErrorMessage(context: AdminErrorContext, err: unknown): string {
    const code = getErrorCode(err)
    const message = getErrorMessage(err).toLowerCase()

    if (code === "42501" || message.includes("not_authorized") || message.includes("permission")) {
        return "Sem permissão para esta operação."
    }

    if (code === "23505" || message.includes("duplicate") || message.includes("unique")) {
        if (context === "students-update-profile") {
            return "Este e-mail já está em uso por outro perfil."
        }
        return "Já existe um registro com os mesmos dados."
    }

    if (
        context === "students-update-profile" &&
        (code === "P0001" || message.includes("student_profile_not_found"))
    ) {
        return "Perfil de aluno não encontrado ou não é mais um aluno."
    }

    if (context === "students-list") {
        return "Não foi possível carregar os alunos agora. Tente novamente."
    }
    if (context === "team-list") {
        return "Não foi possível carregar a equipe agora. Tente novamente."
    }
    if (context === "team-delete") {
        return "Não foi possível remover o membro da equipe."
    }
    if (context === "team-save") {
        return "Não foi possível salvar o membro da equipe."
    }
    if (context === "students-update-profile") {
        return "Não foi possível atualizar os dados do aluno."
    }
    return "Erro inesperado. Tente novamente."
}
