import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyStateNoData } from "@/components/ui/empty-state"

interface PlaceholderPageProps {
  title: string
  description: string
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <AdminLayout>
      <PageHeader title={title} description={description} />
      <EmptyStateNoData
        title="Em Construção"
        description="Esta seção está sendo desenvolvida. Em breve estará disponível."
      />
    </AdminLayout>
  )
}

// All pages have been moved to separate files
export { PlaceholderPage }
