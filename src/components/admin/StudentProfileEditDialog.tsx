import { useEffect } from "react"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Student } from "@/lib/mock-data"

const profileSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
})

export type StudentProfileEditFormValues = z.infer<typeof profileSchema>

type StudentProfileEditDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    student: Student
    onSubmit: (values: StudentProfileEditFormValues) => void
    isSubmitting?: boolean
}

export function StudentProfileEditDialog({
    open,
    onOpenChange,
    student,
    onSubmit,
    isSubmitting,
}: StudentProfileEditDialogProps) {
    const form = useForm<StudentProfileEditFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "", email: "" },
    })

    useEffect(() => {
        if (student && open) {
            form.reset({
                name: student.name,
                email: student.email,
            })
        }
    }, [student, open, form])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Editar dados do aluno</DialogTitle>
                    <DialogDescription>
                        Nome e e-mail exibidos no LXP. Matrículas em cursos continuam em{" "}
                        <span className="font-medium">Admin → Cursos → Alunos</span>.
                    </DialogDescription>
                </DialogHeader>

                <Alert variant="info" className="border-info/50 bg-info-muted/50">
                    <AlertTitle className="text-sm">E-mail e login</AlertTitle>
                    <AlertDescription className="text-xs">
                        Esta alteração atualiza o cadastro em <code className="text-xs">lxp_profiles</code>. O e-mail de
                        acesso no Supabase Auth pode continuar diferente até existir sincronização automática (decisão de
                        produto).
                    </AlertDescription>
                </Alert>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((values) => onSubmit(values))}
                        className="space-y-4"
                    >
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
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Salvando…" : "Salvar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
