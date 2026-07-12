import { Award, Calendar, Edit, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type CertificatesStatsRowProps = {
  templatesCount: number
  issuesCount: number
  thisMonthEmissions: number
  signaturesCount: number
}

export function CertificatesStatsRow({
  templatesCount,
  issuesCount,
  thisMonthEmissions,
  signaturesCount,
}: CertificatesStatsRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templatesCount}</p>
              <p className="text-sm text-muted-foreground">Templates</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{issuesCount}</p>
              <p className="text-sm text-muted-foreground">Total emitidos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{thisMonthEmissions}</p>
              <p className="text-sm text-muted-foreground">Este mês</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Edit className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{signaturesCount}</p>
              <p className="text-sm text-muted-foreground">Assinaturas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
