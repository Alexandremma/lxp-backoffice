import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import type { TeamRole } from "@/consts/teamRoles"
import { roleConfig } from "@/components/admin/team/teamPageHelpers"

type TeamToolbarProps = {
  search: string
  roleFilter: "all" | TeamRole
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: "all" | TeamRole) => void
  onClearFilters: () => void
}

export function TeamToolbar({
  search,
  roleFilter,
  hasActiveFilters,
  onSearchChange,
  onRoleFilterChange,
  onClearFilters,
}: TeamToolbarProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(value) => onRoleFilterChange(value as "all" | TeamRole)}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              {(Object.keys(roleConfig) as TeamRole[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {roleConfig[role].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
