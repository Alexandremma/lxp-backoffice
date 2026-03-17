import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useModuleVisibility } from "@/hooks/useModuleVisibility"
import { RotateCcw, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const DevModulesPage = () => {
  const {
    toggleModule,
    resetToDefault,
    enableAll,
    disableAll,
    getModulesWithVisibility,
    getActiveCount,
  } = useModuleVisibility()

  const modules = getModulesWithVisibility()
  const { active, total } = getActiveCount()

  const handleToggle = (moduleId: string, moduleName: string) => {
    toggleModule(moduleId)
    toast({
      description: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>Configuração salva</span>
        </div>
      ),
    })
  }

  const handleReset = () => {
    resetToDefault()
    toast({
      title: "Configuração resetada",
      description: "Todos os módulos estão visíveis novamente.",
    })
  }

  const handleEnableAll = () => {
    enableAll()
    toast({
      description: "Todos os módulos ativados.",
    })
  }

  const handleDisableAll = () => {
    disableAll()
    toast({
      description: "Módulos opcionais desativados.",
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciamento de Módulos"
          description="Controle quais módulos aparecem no menu da sidebar"
        >
          <Badge variant="warning-muted">Dev</Badge>
        </PageHeader>

        {/* Stats e Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="lg">
              {active} de {total} módulos ativos
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleEnableAll}>
              <Eye className="h-4 w-4 mr-2" />
              Ativar todos
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisableAll}>
              <EyeOff className="h-4 w-4 mr-2" />
              Desativar todos
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar padrão
            </Button>
          </div>
        </div>

        {/* Lista de Módulos */}
        <div className="grid gap-3">
          {modules.map((module) => {
            const IconComponent = module.icon
            return (
              <Card
                key={module.id}
                className={!module.visible ? "opacity-60" : ""}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{module.title}</p>
                        {module.locked && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {module.locked ? (
                      <Badge variant="secondary">Sempre visível</Badge>
                    ) : (
                      <Badge
                        variant={module.visible ? "success-muted" : "secondary"}
                      >
                        {module.visible ? "Visível" : "Oculto"}
                      </Badge>
                    )}
                    <Switch
                      checked={module.visible}
                      onCheckedChange={() =>
                        handleToggle(module.id, module.title)
                      }
                      disabled={module.locked}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Footer */}
        <Card variant="ghost" className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              💡 As configurações são salvas automaticamente no navegador
              (localStorage). Módulos marcados com{" "}
              <Lock className="inline h-3 w-3" /> não podem ser desativados.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default DevModulesPage
