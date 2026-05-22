import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  DATA_ARCHITECTURE_SECTIONS,
  type SchemaColumn,
  type SchemaTable,
} from "@/lib/dataArchitectureSchema"

function ColumnKindLabel({ kind }: { kind: SchemaColumn["kind"] }) {
  if (kind === "pk") {
    return (
      <span className="inline-block w-7 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wide text-orange-400">
        PK
      </span>
    )
  }
  if (kind === "fk") {
    return (
      <span className="inline-block w-7 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wide text-sky-400">
        FK
      </span>
    )
  }
  return <span className="inline-block w-7 shrink-0" aria-hidden />
}

function SchemaTableCard({ table }: { table: SchemaTable }) {
  return (
    <Card className="overflow-hidden border-border/80 bg-card/80 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-1 border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-sm font-semibold tracking-tight text-orange-400">{table.name}</h3>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/90">{table.schemaLabel ?? "public"}</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{table.purpose}</p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/50">
          {table.columns.map((col) => (
            <li key={col.name} className="flex gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
              <div className="flex min-w-0 flex-1 gap-1.5 sm:gap-2">
                <ColumnKindLabel kind={col.kind} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[13px] text-foreground">{col.name}</div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{col.description}</p>
                </div>
              </div>
              <div className="shrink-0 text-right font-mono text-[11px] text-muted-foreground/90">
                <div>{col.sqlType}</div>
                {col.fkRef ? (
                  <div className="mt-0.5 max-w-[140px] truncate text-sky-400/90 sm:max-w-[180px]" title={col.fkRef}>
                    {col.fkRef}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

const DataArchitecturePage = () => {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            <span>Arquitetura</span>
            <span className="mx-1.5 text-border">/</span>
            <span>LXP · Supabase</span>
          </div>
          <PageHeader
            title="Modelo de dados (referência visual)"
            description="Schema `public` no Supabase (migrations Steps 14–23): certificados, gamificação (`rule_config`, XP, níveis), acesso diário, comentários e anotações na aula. Abas Backoffice/Alunos = LXP; aba B42 = EAD Stock/Gael + Alice (`INTEGRACAO_ALICE_EADSTOCK.md`)."
            actions={
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-orange-500/40 bg-orange-500/5 font-mono text-[11px] text-orange-400"
                >
                  RLS por padrão
                </Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/5 font-mono text-[11px] text-emerald-500"
                >
                  Atualizado · mai/2026
                </Badge>
              </div>
            }
          />
        </div>

        <Tabs defaultValue="backoffice" className="w-full space-y-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1 sm:w-auto">
            {DATA_ARCHITECTURE_SECTIONS.map((sec) => (
              <TabsTrigger
                key={sec.id}
                value={sec.id}
                className="font-mono text-xs data-[state=active]:bg-background sm:text-sm"
              >
                {sec.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {DATA_ARCHITECTURE_SECTIONS.map((sec) => (
            <TabsContent key={sec.id} value={sec.id} className="mt-0 space-y-4 outline-none">
              <div className="space-y-1">
                <h2 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">
                  Schema ·{" "}
                  <span className="text-orange-400">
                    {sec.id === "b42" ? "b42 · biblioteca (API)" : `public · ${sec.schemaHighlight}`}
                  </span>
                </h2>
                <p className="max-w-3xl text-sm text-muted-foreground">{sec.intro}</p>
              </div>

              <div
                className={cn(
                  "grid gap-4 pb-2",
                  "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
                )}
              >
                {sec.tables.map((t) => (
                  <SchemaTableCard key={t.name} table={t} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  )
}

export default DataArchitecturePage
