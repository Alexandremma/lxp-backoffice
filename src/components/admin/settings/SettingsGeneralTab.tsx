import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlanUpgradeDialog } from "@/components/admin/settings/PlanUpgradeDialog"
import { formatTeamRoleLabel, mapSubscriptionFeaturesToDisplay } from "@/consts/planCatalog"
import { useAdminAccountCard } from "@/hooks/queries/useAdminAccountCard"
import { useSettingsDashboard } from "@/hooks/queries/useSettingsDashboard"
import { planUsageFromDashboard, type PlanUsageStatus } from "@/lib/planLimits"
import { cn } from "@/lib/utils"
import {
    BarChart3,
    Building2,
    Check,
    Crown,
    Loader2,
    User,
    Users,
    Zap,
    AlertTriangle,
} from "lucide-react"
import { useState } from "react"

export function SettingsGeneralTab() {
    const [upgradeOpen, setUpgradeOpen] = useState(false)
    const { data: dashboard, isLoading, isError, error } = useSettingsDashboard()
    const { data: adminAccount, isLoading: adminLoading } = useAdminAccountCard()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregando informações do plano…
            </div>
        )
    }

    if (isError || !dashboard) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Não foi possível carregar o painel: {(error as Error)?.message ?? "erro desconhecido"}
                </AlertDescription>
            </Alert>
        )
    }

    const { subscription, institution } = dashboard
    const planUsage = planUsageFromDashboard(dashboard)
    const features = mapSubscriptionFeaturesToDisplay(subscription.features)
    const priceMonthly = subscription.priceMonthly ?? 0
    const billingLabel = subscription.billingCycle === "yearly" ? "anual" : "mensal"
    const planStatusLabel =
        subscription.status === "active"
            ? "Ativo"
            : subscription.status === "trial"
                ? "Trial"
                : subscription.status

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Minha conta
                        </CardTitle>
                        <CardDescription>Informações do seu acesso ao backoffice</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {adminLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Carregando perfil…
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{adminAccount?.name ?? "—"}</h3>
                                        <p className="text-sm text-muted-foreground">{adminAccount?.email ?? "—"}</p>
                                        <Badge variant="secondary" className="mt-1">
                                            <Crown className="h-3 w-3 mr-1" />
                                            {formatTeamRoleLabel(adminAccount?.role)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid gap-3 text-sm border-t pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Membro desde</span>
                                        <span>
                                            {adminAccount?.createdAt
                                                ? new Date(adminAccount.createdAt).toLocaleDateString("pt-BR")
                                                : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Último acesso</span>
                                        <span>
                                            {adminAccount?.lastLogin
                                                ? new Date(adminAccount.lastLogin).toLocaleString("pt-BR")
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/admin/perfil">Editar perfil</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-warning" />
                            Plano Atual
                        </CardTitle>
                        <CardDescription>Resumo do plano contratado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-2xl">{subscription.planName}</h3>
                                <p className="text-sm text-muted-foreground">Cobrança {billingLabel}</p>
                            </div>
                            <Badge variant={subscription.status === "active" ? "success-muted" : "secondary"}>
                                <Check className="h-3 w-3 mr-1" />
                                {planStatusLabel}
                            </Badge>
                        </div>
                        <div className="text-3xl font-bold">
                            R$ {priceMonthly.toFixed(2)}
                            <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </div>
                        <div className="pt-2">
                            <Button size="sm" onClick={() => setUpgradeOpen(true)}>
                                <Zap className="h-4 w-4 mr-2" />
                                Fazer Upgrade
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Uso do Plano
                    </CardTitle>
                    <CardDescription>
                        Consumo atual do plano contratado
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(planUsage.students.nearLimit ||
                        planUsage.courses.nearLimit ||
                        planUsage.teamMembers.nearLimit) && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Um ou mais limites estão acima de 90% do plano. Considere fazer upgrade com o
                                    suporte.
                                </AlertDescription>
                            </Alert>
                        )}
                    <div className="grid gap-6 md:grid-cols-3">
                        <UsageMeter icon={Users} label="Alunos" status={planUsage.students} />
                        <UsageMeter icon={Building2} label="Cursos" status={planUsage.courses} />
                        <UsageMeter icon={User} label="Equipe" status={planUsage.teamMembers} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recursos do Plano</CardTitle>
                    <CardDescription>Funcionalidades incluídas no plano {subscription.planName}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                        {features.map((feature) => (
                            <div
                                key={feature.key}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-lg",
                                    feature.included ? "bg-success/10" : "bg-muted/50",
                                )}
                            >
                                <Check
                                    className={cn(
                                        "h-4 w-4",
                                        feature.included ? "text-success" : "text-muted-foreground opacity-40",
                                    )}
                                />
                                <span className={feature.included ? "" : "text-muted-foreground"}>
                                    {feature.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <PlanUpgradeDialog
                open={upgradeOpen}
                onOpenChange={setUpgradeOpen}
                currentPlanId={subscription.planId}
                currentPlanName={subscription.planName}
                institutionName={institution.name}
            />
        </>
    )
}

function UsageMeter({
    icon: Icon,
    label,
    status,
}: {
    icon: typeof Users
    label: string
    status: PlanUsageStatus
}) {
    const { current, limit, percent, nearLimit, atLimit } = status
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                </span>
                <span
                    className={cn(
                        atLimit && "text-destructive font-medium",
                        nearLimit && !atLimit && "text-warning",
                    )}
                >
                    {current}/{limit}
                </span>
            </div>
            <Progress
                value={percent}
                className={cn(
                    "h-2",
                    atLimit && "[&>div]:bg-destructive",
                    nearLimit && !atLimit && "[&>div]:bg-warning",
                )}
            />
        </div>
    )
}
