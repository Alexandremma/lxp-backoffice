import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Student, mockCourses } from "@/lib/mock-data"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

const studentSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  courseIds: z.array(z.string()).min(1, "Selecione pelo menos um curso"),
  status: z.enum(["active", "inactive", "blocked"] as const),
  phone: z.string().optional(),
})

export type StudentFormData = z.infer<typeof studentSchema>

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSave: (data: StudentFormData) => void
}

const statusOptions = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "blocked", label: "Bloqueado" },
]

export function StudentDialog({
  open,
  onOpenChange,
  student,
  onSave,
}: StudentDialogProps) {
  const isEditing = !!student
  const [coursesOpen, setCoursesOpen] = useState(false)

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      courseIds: [],
      status: "active",
      phone: "",
    },
  })

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        email: student.email,
        courseIds: student.enrollments.map(e => e.courseId),
        status: student.status as "active" | "inactive" | "blocked",
        phone: "",
      })
    } else {
      form.reset({
        name: "",
        email: "",
        courseIds: [],
        status: "active",
        phone: "",
      })
    }
  }, [student, form])

  const handleSubmit = (data: StudentFormData) => {
    onSave(data)
    form.reset()
  }

  const selectedCourseIds = form.watch("courseIds")
  const selectedCourses = mockCourses.filter(c => selectedCourseIds.includes(c.id))

  const toggleCourse = (courseId: string) => {
    const current = form.getValues("courseIds")
    if (current.includes(courseId)) {
      form.setValue("courseIds", current.filter(id => id !== courseId), { shouldValidate: true })
    } else {
      form.setValue("courseIds", [...current, courseId], { shouldValidate: true })
    }
  }

  const removeCourse = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const current = form.getValues("courseIds")
    form.setValue("courseIds", current.filter(id => id !== courseId), { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Aluno" : "Novo Aluno"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do aluno."
              : "Preencha as informações para cadastrar um novo aluno."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do aluno" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseIds"
              render={() => (
                <FormItem>
                  <FormLabel>Cursos</FormLabel>
                  <Popover open={coursesOpen} onOpenChange={setCoursesOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={coursesOpen}
                          className={cn(
                            "w-full justify-between h-auto min-h-10",
                            selectedCourseIds.length === 0 && "text-muted-foreground"
                          )}
                        >
                          <div className="flex flex-wrap gap-1">
                            {selectedCourses.length > 0 ? (
                              selectedCourses.map((course) => (
                                <Badge
                                  key={course.id}
                                  variant="secondary"
                                  className="mr-1"
                                >
                                  {course.name.length > 20 
                                    ? course.name.substring(0, 20) + "..." 
                                    : course.name}
                                  <button
                                    type="button"
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={(e) => removeCourse(course.id, e)}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            ) : (
                              <span>Selecione os cursos</span>
                            )}
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <ScrollArea className="h-[200px] p-4">
                        <div className="space-y-2">
                          {mockCourses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                              onClick={() => toggleCourse(course.id)}
                            >
                              <Checkbox
                                checked={selectedCourseIds.includes(course.id)}
                                onCheckedChange={() => toggleCourse(course.id)}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{course.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {course.category === "graduation" ? "Graduação" : 
                                   course.category === "postgraduate" ? "Pós-Graduação" : "Extensão"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(99) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Salvar alterações" : "Cadastrar Aluno"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
