import { formatAuditLogDisplay } from "@/consts/auditLogLabels"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuditLogs } from "@/hooks/queries/useAuditLogs"
import { queryKeys } from "@/consts/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { Clock, Shield, User } from "lucide-react"
import { LoadingSpinner } from "@/components/states/LoadingSpinner"
import { PageLoadingState } from "@/components/states/PageLoadingState"

export function AuditLogsTab() {
    const queryClient = useQueryClient()
    const { data: logs, isLoading, isError, error, isFetching } = useAuditLogs()

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Logs de Auditoria
                    </CardTitle>
                    <CardDescription>
                        Histórico de ações administrativas realizadas no Back Office (últimos 50 registros).
                    </CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isFetching}
                    onClick={() =>
                        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.list({ limit: 50 }) })
                    }
                >
                    {isFetching ? <LoadingSpinner size="sm" /> : "Atualizar"}
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <PageLoadingState variant="section" title="Carregando logs…" className="py-16" />
                ) : isError ? (
                    <p className="px-6 pb-6 text-sm text-destructive">
                        Erro ao carregar auditoria: {(error as Error).message}
                    </p>
                ) : !logs?.length ? (
                    <p className="px-6 pb-8 text-sm text-muted-foreground text-center">
                        Nenhum registro ainda. Ações como editar aluno, salvar instituição ou solicitar upgrade
                        aparecerão aqui.
                    </p>
                ) : (
                    <ScrollArea className="h-[min(364px,calc(100dvh-22rem))]">
                        <div className="p-4 pt-0 space-y-2">
                            {logs.map((row) => {
                                const display = formatAuditLogDisplay(row)
                                return (
                                    <div
                                        key={row.id}
                                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/30"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-medium">{display.actorName}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {display.verb}
                                                </span>
                                                <span className="text-sm font-medium text-foreground/80">
                                                    {display.resourceLabel}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{display.detail}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                                                {display.action}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground shrink-0">
                                            <div className="flex items-center gap-1 justify-end">
                                                <Clock className="h-3 w-3" />
                                                {new Date(row.created_at).toLocaleTimeString("pt-BR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                            <div>
                                                {new Date(row.created_at).toLocaleDateString("pt-BR")}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
