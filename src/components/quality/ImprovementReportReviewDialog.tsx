import { useState } from 'react';
import { ImprovementReport } from '@/hooks/useImprovementReports';
import { useReviewImprovementReport } from '@/hooks/useReviewImprovementReport';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Edit } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ImprovementReportReviewDialogProps {
  report: ImprovementReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
};

export const ImprovementReportReviewDialog = ({
  report,
  open,
  onOpenChange,
}: ImprovementReportReviewDialogProps) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [editedRecommendations, setEditedRecommendations] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const reviewReport = useReviewImprovementReport();

  const handleAction = (action: 'approved' | 'rejected' | 'requires_changes') => {
    reviewReport.mutate(
      {
        report_id: report.id,
        action,
        review_notes: reviewNotes,
        edited_recommendations: editedRecommendations,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const recommendations = (report.recommendations as any[]) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Revisão Humana do Relatório
          </DialogTitle>
          <DialogDescription>
            {report.report_type === 'knowledge_base'
              ? 'Complemento à Base de Conhecimento'
              : 'Refatoração do System Prompt'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList>
            <TabsTrigger value="recommendations">Recomendações ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="summary">Sumário</TabsTrigger>
            <TabsTrigger value="metadata">Metadados</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <Accordion type="single" collapsible className="space-y-2">
                {recommendations.map((rec: any, index: number) => (
                  <AccordionItem key={index} value={`rec-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Badge className={priorityColors[rec.priority as keyof typeof priorityColors]}>
                          {rec.priority}
                        </Badge>
                        <span className="font-medium">{rec.category || 'Categoria'}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Lacuna/Problema</Label>
                        <p className="text-sm mt-1">{rec.issue}</p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Sugestão</Label>
                        <div className="mt-1 p-3 bg-muted rounded-md">
                          {isEditing ? (
                            <Textarea
                              value={rec.suggested_addition}
                              onChange={(e) => {
                                const updated = [...recommendations];
                                updated[index].suggested_addition = e.target.value;
                                setEditedRecommendations(updated);
                              }}
                              className="min-h-[100px] font-mono text-xs"
                            />
                          ) : (
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {rec.suggested_addition}
                            </pre>
                          )}
                        </div>
                      </div>

                      {rec.rationale && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Justificativa</Label>
                          <p className="text-sm mt-1">{rec.rationale}</p>
                        </div>
                      )}

                      {rec.evidence && rec.evidence.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Evidências ({rec.evidence.length})</Label>
                          <div className="space-y-2 mt-2">
                            {rec.evidence.slice(0, 2).map((ev: any, evIndex: number) => (
                              <div key={evIndex} className="text-xs p-2 bg-muted/50 rounded border">
                                <p className="font-medium mb-1">❓ {ev.test_case_question}</p>
                                <p className="text-green-600">✓ Esperado: {ev.expected_answer}</p>
                                <p className="text-red-600">✗ Obtido: {ev.actual_answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>

            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) {
                    setEditedRecommendations(JSON.parse(JSON.stringify(recommendations)));
                  }
                }}
              >
                <Edit className="h-3 w-3 mr-2" />
                {isEditing ? 'Visualizar' : 'Editar Recomendações'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <ScrollArea className="h-[400px]">
              <div className="prose prose-sm max-w-none">
                <p>{report.summary}</p>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metadata">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Execuções Analisadas</Label>
                    <p className="font-medium">{report.failed_executions_analyzed}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Score Mínimo</Label>
                    <p className="font-medium">{report.min_score_threshold}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Período de Análise</Label>
                    <p className="font-medium">
                      {report.analysis_period_start && new Date(report.analysis_period_start).toLocaleDateString('pt-BR')}
                      {' até '}
                      {report.analysis_period_end && new Date(report.analysis_period_end).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gerado em</Label>
                    <p className="font-medium">
                      {new Date(report.generated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <div>
            <Label>Notas de Revisão (opcional)</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Adicione observações sobre este relatório..."
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={() => handleAction('rejected')}
            disabled={reviewReport.isPending}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Rejeitar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction('requires_changes')}
            disabled={reviewReport.isPending}
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Requer Mudanças
          </Button>
          <Button
            onClick={() => handleAction('approved')}
            disabled={reviewReport.isPending}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
