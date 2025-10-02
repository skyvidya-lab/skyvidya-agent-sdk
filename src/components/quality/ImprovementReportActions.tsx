import { useState } from 'react';
import { ImprovementReport } from '@/hooks/useImprovementReports';
import { useApplyImprovementReport } from '@/hooks/useApplyImprovementReport';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown, Copy, CheckCircle, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

interface ImprovementReportActionsProps {
  report: ImprovementReport;
}

export const ImprovementReportActions = ({ report }: ImprovementReportActionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const applyReport = useApplyImprovementReport();

  const handleExportMarkdown = () => {
    setIsExporting(true);

    try {
      const recommendations = (report.recommendations as any[]) || [];
      const typeTitle = report.report_type === 'knowledge_base'
        ? 'Complemento à Base de Conhecimento'
        : 'Sugestões de Melhoria do System Prompt';

      let markdown = `# ${typeTitle}\n\n`;
      markdown += `**Gerado em:** ${new Date(report.generated_at).toLocaleString('pt-BR')}\n`;
      markdown += `**Execuções Analisadas:** ${report.failed_executions_analyzed}\n`;
      markdown += `**Score Mínimo:** ${report.min_score_threshold}%\n\n`;

      if (report.review_status === 'approved') {
        markdown += `✅ **Status:** Aprovado em ${new Date(report.reviewed_at!).toLocaleString('pt-BR')}\n\n`;
      }

      if (report.human_edited) {
        markdown += `✏️ **Editado por revisor humano**\n\n`;
      }

      markdown += `---\n\n`;
      markdown += `## 📋 Sumário Executivo\n\n${report.summary}\n\n`;

      if (report.review_notes) {
        markdown += `### Notas de Revisão\n\n${report.review_notes}\n\n`;
      }

      markdown += `---\n\n`;

      // Group by priority
      const critical = recommendations.filter((r: any) => r.priority === 'critical');
      const high = recommendations.filter((r: any) => r.priority === 'high');
      const medium = recommendations.filter((r: any) => r.priority === 'medium');
      const low = recommendations.filter((r: any) => r.priority === 'low');

      const renderRecommendations = (recs: any[], priorityLabel: string, emoji: string) => {
        if (recs.length === 0) return '';

        let section = `## ${emoji} Prioridade ${priorityLabel}\n\n`;

        recs.forEach((rec: any, index: number) => {
          section += `### ${index + 1}. ${rec.category || 'Categoria'}\n\n`;
          section += `**Lacuna Identificada:**\n${rec.issue}\n\n`;
          section += `**Conteúdo Sugerido:**\n\n`;
          section += `\`\`\`\n${rec.suggested_addition}\n\`\`\`\n\n`;

          if (rec.rationale) {
            section += `**Justificativa:**\n${rec.rationale}\n\n`;
          }

          if (rec.evidence && rec.evidence.length > 0) {
            section += `**Evidências:**\n\n`;
            rec.evidence.slice(0, 3).forEach((ev: any, evIndex: number) => {
              section += `${evIndex + 1}. **Pergunta:** "${ev.test_case_question}"\n`;
              section += `   - **Esperado:** ${ev.expected_answer}\n`;
              section += `   - **Obtido:** ${ev.actual_answer}\n`;
              section += `   - **Scores:** Similarity ${ev.scores?.similarity || 0}%, Factual ${ev.scores?.factual || 0}%, Relevance ${ev.scores?.relevance || 0}%\n\n`;
            });
          }

          section += `---\n\n`;
        });

        return section;
      };

      markdown += renderRecommendations(critical, 'CRÍTICA', '🔴');
      markdown += renderRecommendations(high, 'ALTA', '🟠');
      markdown += renderRecommendations(medium, 'MÉDIA', '🟡');
      markdown += renderRecommendations(low, 'BAIXA', '🔵');

      // Download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${report.report_type}-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Relatório exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const recommendations = (report.recommendations as any[]) || [];
      let text = `${report.summary}\n\n`;

      recommendations.forEach((rec: any, index: number) => {
        text += `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.category}\n`;
        text += `${rec.issue}\n\n`;
        text += `${rec.suggested_addition}\n\n`;
        text += `---\n\n`;
      });

      await navigator.clipboard.writeText(text);
      toast.success('Copiado para a área de transferência');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleApply = () => {
    if (report.applied) {
      toast.info('Este relatório já foi marcado como aplicado');
      return;
    }

    applyReport.mutate({
      report_id: report.id,
      workspace_id: report.workspace_id,
      agent_id: report.agent_id,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportMarkdown} disabled={isExporting}>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyToClipboard}>
          <Copy className="h-4 w-4 mr-2" />
          Copiar para Clipboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleApply}
          disabled={report.review_status !== 'approved' || report.applied || applyReport.isPending}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {report.applied ? 'Já Aplicado' : 'Marcar como Aplicado'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
