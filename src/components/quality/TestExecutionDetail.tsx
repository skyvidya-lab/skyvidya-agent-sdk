import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExecutionDetail } from "@/hooks/useTestExecutions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "./StatusBadge";
import { ScoreDisplay } from "./ScoreDisplay";
import { Clock, Zap, DollarSign, AlertCircle, Lightbulb, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TestExecutionDetailProps {
  executionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestExecutionDetail({ executionId, open, onOpenChange }: TestExecutionDetailProps) {
  const { data: execution, isLoading } = useExecutionDetail(executionId);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Análise Detalhada de Execução</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </div>
        ) : execution ? (
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="p-6 space-y-6">
              {/* Status Grid - Redesigned */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                      <StatusBadge status={execution.status as 'passed' | 'failed' | 'warning' | 'pending'} showIcon={false} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Similaridade</p>
                      <ScoreDisplay score={execution.similarity_score} size="lg" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Precisão</p>
                      <ScoreDisplay score={execution.factual_accuracy} size="lg" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Latência
                      </p>
                      <p className="text-lg font-bold">
                        {execution.latency_ms ? `${(execution.latency_ms / 1000).toFixed(2)}s` : '-'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Custo
                      </p>
                      <p className="text-lg font-bold">
                        {execution.cost_usd !== null ? `$${execution.cost_usd.toFixed(4)}` : '-'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question */}
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Pergunta Testada
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(execution.question_asked, "Pergunta")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-base leading-relaxed">{execution.question_asked}</p>
                </CardContent>
              </Card>

              {/* Answers Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-status-success/30">
                  <CardHeader className="bg-gradient-to-r from-status-success/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">✓ Resposta Esperada</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(execution.expected_answer, "Resposta esperada")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{execution.expected_answer}</p>
                  </CardContent>
                </Card>

                <Card className={execution.actual_answer ? "border-primary/30" : "border-muted"}>
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">⚡ Resposta Obtida</CardTitle>
                      {execution.actual_answer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(execution.actual_answer!, "Resposta obtida")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {execution.actual_answer || (
                        <span className="text-muted-foreground italic">Não disponível</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Validation Analysis */}
              {execution.validation_justification && (
                <Card className="border-accent/30">
                  <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-accent" />
                      Análise da Validação AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {execution.validation_justification}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Cognitive Gaps */}
              {execution.cognitive_gaps && Array.isArray(execution.cognitive_gaps) && execution.cognitive_gaps.length > 0 && (
                <Card className="border-status-warning/30">
                  <CardHeader className="bg-gradient-to-r from-status-warning/5 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-status-warning" />
                      Lacunas Cognitivas Identificadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {execution.cognitive_gaps.map((gap: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-status-warning/5 border border-status-warning/20">
                          <AlertCircle className="h-4 w-4 text-status-warning mt-0.5 flex-shrink-0" />
                          <p className="text-sm">
                            {typeof gap === 'string' ? gap : gap.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Improvement Suggestions */}
              {execution.improvement_suggestions && Array.isArray(execution.improvement_suggestions) && execution.improvement_suggestions.length > 0 && (
                <Card className="border-primary/30">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Sugestões de Melhoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {execution.improvement_suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">
                            {typeof suggestion === 'string' ? suggestion : suggestion.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Execution Metadata */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm">Metadados da Execução</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Executado em</p>
                      <p className="font-medium">
                        {format(new Date(execution.executed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                    {execution.tokens_used && (
                      <div>
                        <p className="text-muted-foreground mb-1">Tokens utilizados</p>
                        <p className="font-medium">{execution.tokens_used.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Execução não encontrada</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
