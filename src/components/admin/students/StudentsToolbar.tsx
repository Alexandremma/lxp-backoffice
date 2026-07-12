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

type CourseOption = { id: string; name: string }

type StudentsToolbarProps = {
  search: string
  statusFilter: string
  courseFilter: string
  courses: CourseOption[]
  hasActiveFilters: boolean
  onFilterChange: (value: string, type: "status" | "course" | "search") => void
  onClearFilters: () => void
}

export function StudentsToolbar({
  search,
  statusFilter,
  courseFilter,
  courses,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
}: StudentsToolbarProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => onFilterChange(e.target.value, "search")}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => onFilterChange(v, "status")}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={(v) => onFilterChange(v, "course")}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
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
