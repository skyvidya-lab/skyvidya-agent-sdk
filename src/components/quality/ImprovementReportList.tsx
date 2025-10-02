import { useState } from 'react';
import { useImprovementReports, ImprovementReport } from '@/hooks/useImprovementReports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, BookOpen, FileCode, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImprovementReportReviewDialog } from './ImprovementReportReviewDialog';
import { ImprovementReportViewer } from './ImprovementReportViewer';

interface ImprovementReportListProps {
  workspaceId: string;
}

const statusConfig = {
  pending_review: { label: 'Pendente', icon: Clock, color: 'bg-yellow-500' },
  under_review: { label: 'Em Análise', icon: AlertTriangle, color: 'bg-blue-500' },
  approved: { label: 'Aprovado', icon: CheckCircle, color: 'bg-green-500' },
  rejected: { label: 'Rejeitado', icon: XCircle, color: 'bg-red-500' },
  requires_changes: { label: 'Requer Mudanças', icon: AlertTriangle, color: 'bg-orange-500' },
};

export const ImprovementReportList = ({ workspaceId }: ImprovementReportListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ImprovementReport | null>(null);
  const [viewReport, setViewReport] = useState<ImprovementReport | null>(null);

  const { data: reports, isLoading } = useImprovementReports({
    workspace_id: workspaceId,
    review_status: statusFilter === 'all' ? undefined : statusFilter,
    report_type: typeFilter === 'all' ? undefined : (typeFilter as any),
  });

  if (isLoading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum relatório gerado ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending_review">Pendente</SelectItem>
            <SelectItem value="under_review">Em Análise</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="requires_changes">Requer Mudanças</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="knowledge_base">Base de Conhecimento</SelectItem>
            <SelectItem value="system_prompt">System Prompt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Cards */}
      <div className="space-y-3">
        {reports.map((report) => {
          const StatusIcon = statusConfig[report.review_status].icon;
          const reportIcon = report.report_type === 'knowledge_base' ? BookOpen : FileCode;
          const ReportIcon = reportIcon;

          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ReportIcon className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">
                        {report.report_type === 'knowledge_base'
                          ? 'Complemento à Base de Conhecimento'
                          : 'Refatoração do System Prompt'}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {(report as any).agents?.name} • {report.failed_executions_analyzed} execuções analisadas
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[report.review_status].label}
                    </Badge>
                    {report.human_edited && (
                      <Badge variant="secondary">Editado</Badge>
                    )}
                    {report.applied && (
                      <Badge variant="default">Aplicado</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {report.summary}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Gerado em {format(new Date(report.generated_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <div className="flex gap-2">
                    {report.review_status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewReport(report)}
                      >
                        Ver Detalhes
                      </Button>
                    )}
                    {['pending_review', 'under_review', 'requires_changes'].includes(report.review_status) && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        Revisar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Review Dialog */}
      {selectedReport && (
        <ImprovementReportReviewDialog
          report={selectedReport}
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}

      {/* View Dialog */}
      {viewReport && (
        <ImprovementReportViewer
          report={viewReport}
          open={!!viewReport}
          onOpenChange={(open) => !open && setViewReport(null)}
        />
      )}
    </div>
  );
};
