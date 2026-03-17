import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Edit, 
  Trash2, 
  Link, 
  Package,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BookOpen,
  Tag,
  Clock,
  CreditCard,
} from "lucide-react"
import { toast } from "sonner"
import { 
  Product, 
  ProductType, 
  productTypeConfig, 
  billingCycleLabels,
  mockCourses,
} from "@/lib/mock-data"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

interface ProductDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onEdit: () => void
  onDelete: () => void
}

export function ProductDetailsSheet({
  open,
  onOpenChange,
  product,
  onEdit,
  onDelete,
}: ProductDetailsSheetProps) {
  if (!product) return null

  const typeConfig = productTypeConfig[product.type]
  const TypeIcon = typeConfig.icon

  const handleCopyCheckoutLink = () => {
    const link = product.checkoutUrl || `https://checkout.exemplo.com/${product.id}`
    navigator.clipboard.writeText(link)
    toast.success("Link de checkout copiado!")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Ativo</Badge>
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const linkedCourseNames = product.linkedCourses
    .map((id) => mockCourses.find((c) => c.id === id)?.name)
    .filter(Boolean)

  const discountPercentage = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          {/* Header com Badge de Tipo */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TypeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Badge variant={typeConfig.variant as any} className="mb-1">
                  {typeConfig.label}
                </Badge>
                {getStatusBadge(product.status)}
              </div>
            </div>
          </div>

          <div>
            <SheetTitle className="text-xl">{product.name}</SheetTitle>
            <SheetDescription className="mt-1">
              {product.description}
            </SheetDescription>
          </div>

          {/* Preço em destaque */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatCurrency(product.price)}
              </span>
              {product.type === "subscription" && product.billingCycle && (
                <span className="text-muted-foreground">
                  /{billingCycleLabels[product.billingCycle]}
                </span>
              )}
            </div>
            {product.originalPrice && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
                <Badge variant="success">-{discountPercentage}%</Badge>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm">Vendas</span>
              </div>
              <p className="text-2xl font-bold">{product.salesCount}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Receita</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(product.revenue)}</p>
            </div>
          </div>

          <Separator />

          {/* Configurações de Preço */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Configurações de Preço
            </h3>
            
            <div className="space-y-2 text-sm">
              {product.type === "subscription" && (
                <>
                  {product.billingCycle && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ciclo de cobrança</span>
                      <span className="font-medium capitalize">
                        {billingCycleLabels[product.billingCycle]}
                      </span>
                    </div>
                  )}
                  {product.trialDays !== undefined && product.trialDays > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Período de trial</span>
                      <span className="font-medium">{product.trialDays} dias</span>
                    </div>
                  )}
                </>
              )}

              {product.type === "one_time" && product.installmentsEnabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parcelamento</span>
                  <span className="font-medium">
                    Até {product.maxInstallments}x de{" "}
                    {formatCurrency(product.price / (product.maxInstallments || 1))}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Cursos Vinculados */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos Vinculados ({linkedCourseNames.length})
            </h3>
            
            <div className="space-y-2">
              {linkedCourseNames.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50"
                >
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadados */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Criado em {formatDate(product.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Atualizado em {formatDate(product.updatedAt)}</span>
            </div>
          </div>

          <Separator />

          {/* Ações */}
          <div className="space-y-2">
            <Button className="w-full" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Produto
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCopyCheckoutLink}
            >
              <Link className="h-4 w-4 mr-2" />
              Copiar Link de Checkout
            </Button>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Produto
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
