import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CLIENT_INTAKE_TOPIC_CATEGORIES, topicsByCategory } from "@/lib/clientIntakeTopics"

const byCat = topicsByCategory()

const ClientIntakePage = () => {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader
          title="Roteiro — informações e decisões com o cliente"
          description="Checklist para reuniões: integração (EAD Stock / Gael / Alice), certificados, métricas, Auth e catálogo. Comece pela seção Respostas recebidas (consolidado do e-mail + payloads); as demais seções trazem o que ainda falta fechar."
        />

        <p className="-mt-4 text-sm text-muted-foreground">
          Referências principais:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">INTEGRACAO_B42_RESPOSTAS_CLIENTE.md</code>,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">DECISOES_PENDENTES_CLIENTE_B42.md</code>,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">DOC_PEDIDO_INTEGRACOES_BIBLIOTECA_E_EBOOKS.md</code>,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">CONTINUACAO_CERTIFICADO_GAMIFICACAO.md</code>,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">HOMOLOGACAO_CLIENTE_LXP_UAT.md</code>.
        </p>

        <div className="space-y-10">
          {CLIENT_INTAKE_TOPIC_CATEGORIES.map((category) => {
            const topics = byCat.get(category) ?? []
            if (topics.length === 0) return null
            return (
              <section key={category} className="space-y-4">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">{category}</h2>
                <div className="space-y-5">
                  {topics.map((topic) => (
                    <Card key={topic.id} className="border-border/80">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base leading-snug md:text-lg">{topic.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="space-y-2 text-muted-foreground">
                          {topic.explanation.map((p, i) => (
                            <p key={i} className="leading-relaxed">
                              {p}
                            </p>
                          ))}
                        </div>

                        {topic.decisionOptions && topic.decisionOptions.length > 0 ? (
                          <>
                            <Separator />
                            <div>
                              <p className="mb-2 font-medium text-foreground">Opções viáveis (decisão)</p>
                              <ul className="list-inside list-disc space-y-1.5 text-muted-foreground marker:text-primary">
                                {topic.decisionOptions.map((opt, i) => (
                                  <li key={i} className="leading-relaxed ps-1">
                                    {opt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        ) : null}

                        <Separator />

                        <div>
                          <p className="mb-2 font-medium text-foreground">Exatamente o que precisamos para seguir</p>
                          <ul className="list-inside list-disc space-y-1.5 text-muted-foreground marker:text-foreground">
                            {topic.whatWeNeed.map((item, i) => (
                              <li key={i} className="leading-relaxed ps-1">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator />

                        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                          {/* <p className="mb-2 text-xs font-medium text-primary/90">Sugestão de abordagem na conversa</p> */}
                          <p className="text-sm leading-relaxed text-foreground/95">{topic.scriptForClient}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}

export default ClientIntakePage
