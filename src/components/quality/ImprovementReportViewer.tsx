import { ImprovementReport } from '@/hooks/useImprovementReports';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle } from 'lucide-react';
import { ImprovementReportActions } from './ImprovementReportActions';

interface ImprovementReportViewerProps {
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

export const ImprovementReportViewer = ({
  report,
  open,
  onOpenChange,
}: ImprovementReportViewerProps) => {
  const recommendations = (report.recommendations as any[]) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Relatório Aprovado
              </DialogTitle>
              <DialogDescription>
                {report.report_type === 'knowledge_base'
                  ? 'Complemento à Base de Conhecimento'
                  : 'Refatoração do System Prompt'}
              </DialogDescription>
            </div>
            <ImprovementReportActions report={report} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList>
            <TabsTrigger value="recommendations">Recomendações ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="summary">Sumário</TabsTrigger>
            {report.human_edited && <TabsTrigger value="changes">Edições Humanas</TabsTrigger>}
          </TabsList>

          <TabsContent value="recommendations" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
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
                        <Label className="text-xs text-muted-foreground">Conteúdo Sugerido</Label>
                        <div className="mt-1 p-3 bg-muted rounded-md">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {rec.suggested_addition}
                          </pre>
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
                            {rec.evidence.slice(0, 3).map((ev: any, evIndex: number) => (
                              <div key={evIndex} className="text-xs p-2 bg-muted/50 rounded border">
                                <p className="font-medium mb-1">❓ {ev.test_case_question}</p>
                                <p className="text-green-600">✓ Esperado: {ev.expected_answer}</p>
                                <p className="text-red-600">✗ Obtido: {ev.actual_answer}</p>
                                <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                                  <span>Similarity: {ev.scores?.similarity || 0}%</span>
                                  <span>Factual: {ev.scores?.factual || 0}%</span>
                                  <span>Relevance: {ev.scores?.relevance || 0}%</span>
                                </div>
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
          </TabsContent>

          <TabsContent value="summary">
            <ScrollArea className="h-[500px]">
              <div className="prose prose-sm max-w-none">
                <h3>Sumário Executivo</h3>
                <p>{report.summary}</p>

                {report.review_notes && (
                  <>
                    <h4 className="mt-4">Notas de Revisão</h4>
                    <p className="text-muted-foreground italic">{report.review_notes}</p>
                  </>
                )}

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Execuções Analisadas</Label>
                    <p className="font-medium">{report.failed_executions_analyzed}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Score Mínimo</Label>
                    <p className="font-medium">{report.min_score_threshold}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Revisado por</Label>
                    <p className="font-medium">
                      {report.reviewed_at && new Date(report.reviewed_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="font-medium">
                      {report.applied ? '✅ Aplicado' : '⏳ Não Aplicado'}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {report.human_edited && report.original_recommendations && (
            <TabsContent value="changes">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Este relatório foi editado por um revisor humano. As alterações são rastreáveis.
                  </p>
                  {/* Side-by-side comparison could be implemented here */}
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="text-sm">
                      💡 As recomendações originais geradas pela IA foram preservadas e estão disponíveis
                      para auditoria.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
