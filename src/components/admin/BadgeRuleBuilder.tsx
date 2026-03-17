import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BadgeRule, BadgeTriggerType, BadgeOperator } from "@/lib/mock-data"
import { BADGE_TRIGGERS, BADGE_OPERATORS, generateConditionText } from "@/lib/badge-rules"
import { Plus, X } from "lucide-react"

interface BadgeRuleBuilderProps {
  rules: BadgeRule[]
  matchMode: "all" | "any"
  onChange: (rules: BadgeRule[], matchMode: "all" | "any") => void
}

export const BadgeRuleBuilder = ({
  rules,
  matchMode,
  onChange,
}: BadgeRuleBuilderProps) => {
  const addRule = () => {
    const newRule: BadgeRule = {
      id: `rule_${Date.now()}`,
      trigger: "lessons_completed",
      operator: "gte",
      value: 1,
    }
    onChange([...rules, newRule], matchMode)
  }

  const removeRule = (ruleId: string) => {
    onChange(
      rules.filter((r) => r.id !== ruleId),
      matchMode
    )
  }

  const updateRule = (ruleId: string, updates: Partial<BadgeRule>) => {
    onChange(
      rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
      matchMode
    )
  }

  const triggerKeys = Object.keys(BADGE_TRIGGERS) as BadgeTriggerType[]
  const operatorKeys = Object.keys(BADGE_OPERATORS) as BadgeOperator[]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma regra configurada. Adicione uma condição para definir como o badge será conquistado.
          </div>
        ) : (
          rules.map((rule, index) => {
            const trigger = BADGE_TRIGGERS[rule.trigger]
            const isBoolean = trigger.valueType === "boolean"

            return (
              <div
                key={rule.id}
                className="rounded-lg border bg-muted/30 p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Regra {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeRule(rule.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  {/* Trigger Select */}
                  <div className="col-span-5">
                    <Select
                      value={rule.trigger}
                      onValueChange={(value: BadgeTriggerType) => {
                        const newTrigger = BADGE_TRIGGERS[value]
                        updateRule(rule.id, {
                          trigger: value,
                          value: newTrigger.valueType === "boolean" ? true : 1,
                          operator: newTrigger.valueType === "boolean" ? "eq" : "gte",
                        })
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerKeys.map((key) => {
                          const t = BADGE_TRIGGERS[key]
                          const TriggerIcon = t.icon
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <TriggerIcon className="h-3.5 w-3.5" />
                                <span>{t.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator Select - only for numeric */}
                  {!isBoolean && (
                    <div className="col-span-3">
                      <Select
                        value={rule.operator}
                        onValueChange={(value: BadgeOperator) =>
                          updateRule(rule.id, { operator: value })
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorKeys.map((key) => (
                            <SelectItem key={key} value={key}>
                              {BADGE_OPERATORS[key].symbol} ({BADGE_OPERATORS[key].label})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Value Input - only for numeric */}
                  {!isBoolean && (
                    <div className="col-span-4">
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          value={rule.value as number}
                          onChange={(e) =>
                            updateRule(rule.id, {
                              value: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-9 text-xs pr-12"
                        />
                        {trigger.unit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {trigger.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Boolean indicator */}
                  {isBoolean && (
                    <div className="col-span-7 flex items-center">
                      <span className="text-xs text-muted-foreground">
                        Condição ativada automaticamente
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRule}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar condição
      </Button>

      {rules.length > 1 && (
        <div className="space-y-2">
          <Label className="text-xs">Modo de combinação</Label>
          <RadioGroup
            value={matchMode}
            onValueChange={(value: "all" | "any") => onChange(rules, value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="match-all" />
              <Label htmlFor="match-all" className="text-xs font-normal cursor-pointer">
                Todas as condições (E)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="match-any" />
              <Label htmlFor="match-any" className="text-xs font-normal cursor-pointer">
                Qualquer uma (OU)
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {rules.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Preview da condição:</p>
          <p className="text-sm font-medium">
            {generateConditionText(rules, matchMode)}
          </p>
        </div>
      )}
    </div>
  )
}
