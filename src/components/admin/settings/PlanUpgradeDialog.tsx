import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockSubscriptionPlans, type SubscriptionPlan } from "@/lib/mock-data"
import { toast } from "sonner"

type PlanUpgradeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanId: string
}

export function PlanUpgradeDialog({ open, onOpenChange, currentPlanId }: PlanUpgradeDialogProps) {
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlanId) {
      toast.info(`Você já está no plano ${plan.name}.`)
      return
    }
    toast.success(
      `Solicitação registrada (demonstração): upgrade para o plano ${plan.name}. A equipe B42 entrará em contato.`,
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            Planos disponíveis
          </DialogTitle>
          <DialogDescription>
            Compare os planos e escolha o que melhor atende sua instituição. A contratação será
            confirmada pela equipe B42.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 pt-2">
          {mockSubscriptionPlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col",
                  plan.highlighted && "border-primary shadow-md",
                  isCurrent && "ring-2 ring-primary/40",
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Mais popular</Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-2xl font-bold">R$ {plan.priceMonthly.toFixed(0)}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <ul className="space-y-2 text-sm flex-1">
                    {plan.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : plan.highlighted ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrent ? "Plano atual" : "Selecionar plano"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
