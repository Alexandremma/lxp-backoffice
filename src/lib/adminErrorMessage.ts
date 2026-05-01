type AdminErrorContext =
    | "dashboard-load"
    | "team-save"
    | "team-delete"
    | "students-create"
    | "students-delete"
    | "students-access"
    | "students-update-profile"
    | "students-list"
    | "team-list"
    | "courses-save"
    | "courses-list"
    | "courses-delete"
    | "courses-update"
    | "courses-grades"
    | "courses-disciplines"
    | "courses-content"
    | "courses-students"

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

    if (context === "team-save") {
        if (code === "TEAM_MEMBER_EXISTS") {
            return "Já existe um membro da equipe com este e-mail."
        }
        if (code === "AUTH_USER_ALREADY_EXISTS") {
            return "Já existe uma conta de acesso para este e-mail. Use outro e-mail para convidar este membro."
        }
        if (code === "TEAM_MEMBER_NOT_FOUND") {
            return "Não existe membro da equipe com este e-mail para reenviar convite."
        }
        if (code === "INVITE_NOT_ALLOWED") {
            return "Somente administradores podem convidar novos membros."
        }
        if (code === "INVITE_BAD_REQUEST") {
            return "Dados inválidos para envio do convite."
        }
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
    if (context === "dashboard-load") {
        return "Não foi possível carregar os indicadores do dashboard."
    }
    if (context === "team-delete") {
        return "Não foi possível remover o membro da equipe."
    }
    if (context === "team-save") {
        return "Não foi possível salvar o membro da equipe."
    }
    if (context === "students-create") {
        if (code === "STUDENT_ALREADY_EXISTS") {
            return "Já existe aluno com este e-mail."
        }
        if (code === "NOT_AUTHORIZED") {
            return "Sem permissão para cadastrar aluno."
        }
        if (code === "INVALID_PAYLOAD") {
            return "Preencha corretamente os dados do novo aluno."
        }
        return "Não foi possível criar o aluno."
    }
    if (context === "students-delete") {
        if (code === "STUDENT_NOT_FOUND") {
            return "Aluno não encontrado para exclusão."
        }
        if (code === "NOT_AUTHORIZED") {
            return "Sem permissão para excluir aluno."
        }
        return "Não foi possível excluir o aluno."
    }
    if (context === "students-access") {
        if (code === "STUDENT_NOT_FOUND") {
            return "Aluno não encontrado para atualização de acesso."
        }
        if (code === "NOT_AUTHORIZED") {
            return "Sem permissão para bloquear/desbloquear aluno."
        }
        return "Não foi possível atualizar o acesso do aluno."
    }
    if (context === "students-update-profile") {
        return "Não foi possível atualizar os dados do aluno."
    }
    if (context === "courses-save") {
        return "Não foi possível salvar o curso."
    }
    if (context === "courses-list") {
        return "Não foi possível carregar os cursos agora. Tente novamente."
    }
    if (context === "courses-delete") {
        return "Não foi possível excluir o curso."
    }
    if (context === "courses-update") {
        return "Não foi possível atualizar os dados do curso."
    }
    if (context === "courses-grades") {
        return "Não foi possível concluir a operação de grades."
    }
    if (context === "courses-disciplines") {
        return "Não foi possível concluir a operação de disciplinas."
    }
    if (context === "courses-content") {
        return "Não foi possível concluir a operação de disciplinas externas."
    }
    if (context === "courses-students") {
        return "Não foi possível concluir a operação de alunos do curso."
    }
    return "Erro inesperado. Tente novamente."
}
