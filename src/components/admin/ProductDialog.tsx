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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Product, ProductType, BillingCycle, mockCourses } from "@/lib/mock-data"

const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  type: z.enum(["subscription", "one_time", "combo", "freemium", "certification"]),
  status: z.enum(["active", "inactive", "draft"]),
  price: z.coerce.number().min(0, "Preço não pode ser negativo"),
  originalPrice: z.coerce.number().optional().nullable(),
  billingCycle: z.enum(["monthly", "quarterly", "semiannual", "annual"]).optional().nullable(),
  trialDays: z.coerce.number().min(0).max(90).optional().nullable(),
  installmentsEnabled: z.boolean().optional(),
  maxInstallments: z.coerce.number().min(1).max(24).optional().nullable(),
  linkedCourses: z.array(z.string()).min(1, "Selecione pelo menos um curso"),
  tags: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSave: (data: Partial<Product>) => void
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: ProductDialogProps) {
  const isEditing = !!product

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "one_time",
      status: "draft",
      price: 0,
      originalPrice: null,
      billingCycle: null,
      trialDays: null,
      installmentsEnabled: false,
      maxInstallments: null,
      linkedCourses: [],
      tags: "",
    },
  })

  const watchType = form.watch("type")
  const watchInstallmentsEnabled = form.watch("installmentsEnabled")

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        type: product.type,
        status: product.status,
        price: product.price,
        originalPrice: product.originalPrice || null,
        billingCycle: product.billingCycle || null,
        trialDays: product.trialDays || null,
        installmentsEnabled: product.installmentsEnabled || false,
        maxInstallments: product.maxInstallments || null,
        linkedCourses: product.linkedCourses,
        tags: product.tags?.join(", ") || "",
      })
    } else {
      form.reset({
        name: "",
        description: "",
        type: "one_time",
        status: "draft",
        price: 0,
        originalPrice: null,
        billingCycle: null,
        trialDays: null,
        installmentsEnabled: false,
        maxInstallments: null,
        linkedCourses: [],
        tags: "",
      })
    }
  }, [product, form])

  const onSubmit = (data: ProductFormData) => {
    const tags = data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : []
    
    onSave({
      name: data.name,
      description: data.description,
      type: data.type as ProductType,
      status: data.status as "active" | "inactive" | "draft",
      price: data.price,
      originalPrice: data.originalPrice || undefined,
      billingCycle: data.billingCycle as BillingCycle | undefined,
      trialDays: data.trialDays || undefined,
      installmentsEnabled: data.installmentsEnabled,
      maxInstallments: data.maxInstallments || undefined,
      linkedCourses: data.linkedCourses,
      tags,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do produto"
              : "Preencha as informações para criar um novo produto"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Plano Mensal Premium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o produto..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Produto</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="subscription">Assinatura</SelectItem>
                          <SelectItem value="one_time">Compra Única</SelectItem>
                          <SelectItem value="combo">Combo/Pacote</SelectItem>
                          <SelectItem value="freemium">Freemium</SelectItem>
                          <SelectItem value="certification">Certificação</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Preços */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Configurações de Preço
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Original (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Para mostrar desconto"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional - para exibir desconto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos específicos para Assinatura */}
                {watchType === "subscription" && (
                  <>
                    <FormField
                      control={form.control}
                      name="billingCycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciclo de Cobrança</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o ciclo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="quarterly">Trimestral</SelectItem>
                              <SelectItem value="semiannual">Semestral</SelectItem>
                              <SelectItem value="annual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trialDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dias de Trial</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Período de teste gratuito
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Campos específicos para Compra Única */}
                {watchType === "one_time" && (
                  <>
                    <FormField
                      control={form.control}
                      name="installmentsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Parcelamento</FormLabel>
                            <FormDescription>
                              Permitir pagamento parcelado
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {watchInstallmentsEnabled && (
                      <FormField
                        control={form.control}
                        name="maxInstallments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máx. de Parcelas</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="12"
                                min={1}
                                max={24}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Cursos Vinculados */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Cursos Vinculados
              </h3>

              <FormField
                control={form.control}
                name="linkedCourses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione os cursos inclusos</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {mockCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center space-x-2 rounded-lg border p-3"
                        >
                          <Checkbox
                            id={course.id}
                            checked={field.value?.includes(course.id)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...(field.value || []), course.id]
                                : field.value?.filter((id) => id !== course.id) || []
                              field.onChange(newValue)
                            }}
                          />
                          <label
                            htmlFor={course.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {course.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="destaque, popular, novo (separadas por vírgula)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Separe as tags por vírgula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
