import { useExecutionDetail } from '@/hooks/useTestExecutions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TestExecutionDetailProps {
  executionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TestExecutionDetail = ({ executionId, open, onOpenChange }: TestExecutionDetailProps) => {
  const { data: execution, isLoading } = useExecutionDetail(executionId);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      passed: 'bg-green-500/10 text-green-700 dark:text-green-400',
      failed: 'bg-red-500/10 text-red-700 dark:text-red-400',
      warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      pending: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    };
    return colors[status] || colors.pending;
  };

  if (isLoading || !execution) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="text-center py-8">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes da Execução</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Status & Metrics */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(execution.status)}>
                    {execution.status}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Similaridade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {execution.similarity_score ? `${execution.similarity_score.toFixed(1)}%` : '-'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Acurácia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {execution.factual_accuracy ? `${execution.factual_accuracy.toFixed(1)}%` : '-'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Latência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {execution.latency_ms ? `${execution.latency_ms}ms` : '-'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Custo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {execution.cost_usd ? `$${execution.cost_usd.toFixed(4)}` : '-'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Question Asked */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Pergunta</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                {execution.question_asked}
              </div>
            </div>

            <Separator />

            {/* Expected Answer */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Resposta Esperada</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                {execution.expected_answer}
              </div>
            </div>

            <Separator />

            {/* Actual Answer */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Resposta Obtida</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                {execution.actual_answer || 'Sem resposta'}
              </div>
            </div>

            {execution.validation_justification && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Justificativa da Validação</h3>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    {execution.validation_justification}
                  </div>
                </div>
              </>
            )}

            {execution.cognitive_gaps && Array.isArray(execution.cognitive_gaps) && execution.cognitive_gaps.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Gaps Cognitivos Identificados</h3>
                  <div className="space-y-2">
                    {execution.cognitive_gaps.map((gap: any, idx: number) => (
                      <div key={idx} className="bg-red-500/10 p-3 rounded-lg text-sm">
                        • {typeof gap === 'string' ? gap : JSON.stringify(gap)}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {execution.improvement_suggestions && Array.isArray(execution.improvement_suggestions) && execution.improvement_suggestions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Sugestões de Melhoria</h3>
                  <div className="space-y-2">
                    {execution.improvement_suggestions.map((suggestion: any, idx: number) => (
                      <div key={idx} className="bg-blue-500/10 p-3 rounded-lg text-sm">
                        • {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
