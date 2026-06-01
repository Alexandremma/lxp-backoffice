import { Link } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { type PlanResource, type PlanUsageStatus } from "@/lib/planLimits"
import { AlertTriangle } from "lucide-react"

const RESOURCE_LABELS: Record<PlanResource, string> = {
    students: "alunos",
    courses: "cursos",
    teamMembers: "membros da equipe",
}

type PlanLimitBannerProps = {
    resource: PlanResource
    status: PlanUsageStatus | undefined
}

export function PlanLimitBanner({ resource, status }: PlanLimitBannerProps) {
    if (!status?.nearLimit && !status?.atLimit) return null

    const label = RESOURCE_LABELS[resource]

    return (
        <Alert variant={status.atLimit ? "destructive" : "default"} className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
                {status.atLimit ? `Limite de ${label} atingido` : `Limite de ${label} quase no máximo`}
            </AlertTitle>
            <AlertDescription>
                Uso atual: {status.current}/{status.limit} ({Math.round(status.percent)}%).
                {status.atLimit ? (
                    <>
                        {" "}
                        Não é possível cadastrar novos {label} até fazer upgrade do plano em{" "}
                        <Link to="/admin/configuracoes" className="font-medium underline underline-offset-4">
                            Configurações
                        </Link>
                        .
                    </>
                ) : (
                    <>
                        {" "}
                        Considere fazer upgrade em{" "}
                        <Link to="/admin/configuracoes" className="font-medium underline underline-offset-4">
                            Configurações
                        </Link>{" "}
                        antes de atingir o limite.
                    </>
                )}
            </AlertDescription>
        </Alert>
    )
}
