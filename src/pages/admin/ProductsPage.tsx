import { useState } from "react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Link,
  Power,
  Trash2,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  RefreshCcw,
  Gift,
  Award,
} from "lucide-react"
import { toast } from "sonner"
import { 
  mockProducts, 
  Product, 
  ProductType,
  productTypeConfig,
  billingCycleLabels,
} from "@/lib/mock-data"
import { ProductDialog } from "@/components/admin/ProductDialog"
import { ProductDetailsSheet } from "@/components/admin/ProductDetailsSheet"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Filtros
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || product.type === typeFilter
    const matchesStatus = statusFilter === "all" || product.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Estatísticas
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.status === "active").length
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0)

  // Handlers
  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailsOpen(true)
  }

  const handleDuplicateProduct = (product: Product) => {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      name: `${product.name} (Cópia)`,
      status: "draft",
      salesCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    }
    setProducts((prev) => [...prev, newProduct])
    toast.success("Produto duplicado com sucesso!")
  }

  const handleCopyCheckoutLink = (product: Product) => {
    const link = product.checkoutUrl || `https://checkout.exemplo.com/${product.id}`
    navigator.clipboard.writeText(link)
    toast.success("Link de checkout copiado!")
  }

  const handleToggleStatus = (product: Product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, status: p.status === "active" ? "inactive" : "active" }
          : p
      )
    )
    toast.success(
      product.status === "active" 
        ? "Produto desativado" 
        : "Produto ativado"
    )
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedProduct) {
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id))
      toast.success("Produto excluído com sucesso!")
      setIsDeleteOpen(false)
      setSelectedProduct(null)
    }
  }

  const handleSaveProduct = (data: Partial<Product>) => {
    if (selectedProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, ...data, updatedAt: new Date().toISOString().split("T")[0] }
            : p
        )
      )
      toast.success("Produto atualizado com sucesso!")
    } else {
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        name: data.name || "",
        description: data.description || "",
        type: data.type || "one_time",
        status: data.status || "draft",
        price: data.price || 0,
        originalPrice: data.originalPrice,
        currency: "BRL",
        billingCycle: data.billingCycle,
        trialDays: data.trialDays,
        installmentsEnabled: data.installmentsEnabled,
        maxInstallments: data.maxInstallments,
        linkedCourses: data.linkedCourses || [],
        salesCount: 0,
        revenue: 0,
        tags: data.tags || [],
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      setProducts((prev) => [...prev, newProduct])
      toast.success("Produto criado com sucesso!")
    }
    setIsDialogOpen(false)
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

  const getTypeBadge = (type: ProductType) => {
    const config = productTypeConfig[type]
    return (
      <Badge variant={config.variant as any} className="gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriceDisplay = (product: Product) => {
    const price = formatCurrency(product.price)
    if (product.type === "subscription" && product.billingCycle) {
      return `${price}/${billingCycleLabels[product.billingCycle]}`
    }
    if (product.installmentsEnabled && product.maxInstallments) {
      return `${product.maxInstallments}x de ${formatCurrency(product.price / product.maxInstallments)}`
    }
    return price
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Produtos"
          description="Gerencie seus produtos, planos e modelos de negócio"
        >
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Produtos"
            value={totalProducts}
            icon={Package}
          />
          <StatCard
            title="Produtos Ativos"
            value={activeProducts}
            icon={ShoppingCart}
            trend={{ value: Math.round((activeProducts / totalProducts) * 100), label: "ativos" }}
          />
          <StatCard
            title="Receita Total"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
          />
          <StatCard
            title="Total de Vendas"
            value={totalSales}
            icon={TrendingUp}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="subscription">Assinatura</SelectItem>
              <SelectItem value="one_time">Compra Única</SelectItem>
              <SelectItem value="combo">Combo</SelectItem>
              <SelectItem value="freemium">Freemium</SelectItem>
              <SelectItem value="certification">Certificação</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(product)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(product.type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getPriceDisplay(product)}</p>
                        {product.originalPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.originalPrice)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">{product.salesCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyCheckoutLink(product)}>
                            <Link className="h-4 w-4 mr-2" />
                            Copiar link de checkout
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                            <Power className="h-4 w-4 mr-2" />
                            {product.status === "active" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogs */}
      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />

      <ProductDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        product={selectedProduct}
        onEdit={() => {
          setIsDetailsOpen(false)
          setIsDialogOpen(true)
        }}
        onDelete={() => {
          setIsDetailsOpen(false)
          setIsDeleteOpen(true)
        }}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${selectedProduct?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  )
}

export default ProductsPage
