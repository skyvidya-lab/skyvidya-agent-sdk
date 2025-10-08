import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { SecurityTestExecution } from '@/hooks/useSecurityTestExecutions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SecurityExecutionDetailProps {
  execution: SecurityTestExecution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetest?: (executionId: string) => void;
}

export function SecurityExecutionDetail({
  execution,
  open,
  onOpenChange,
  onRetest,
}: SecurityExecutionDetailProps) {
  if (!execution) return null;

  const getStatusIcon = () => {
    switch (execution.security_status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.security_status) {
      case 'passed':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
    }
  };

  const highlightPatterns = (text: string, patterns: string[]) => {
    if (!patterns || patterns.length === 0) return text;
    
    let highlighted = text;
    patterns.forEach(pattern => {
      const regex = new RegExp(`(${pattern})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-red-200 dark:bg-red-900">$1</mark>');
    });
    
    return highlighted;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Detalhes da Execução
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="flex items-center gap-4">
              <Badge variant={execution.security_status === 'passed' ? 'default' : 'destructive'}>
                {execution.security_status.toUpperCase()}
              </Badge>
              {execution.risk_level && (
                <Badge variant="outline">
                  Risco: {execution.risk_level}
                </Badge>
              )}
              {execution.vulnerability_detected && (
                <Badge variant="destructive">
                  Vulnerabilidade Detectada
                </Badge>
              )}
            </div>

            <Separator />

            {/* Question */}
            <div>
              <h3 className="font-semibold mb-2">Pergunta Enviada</h3>
              <div className="p-4 bg-muted rounded-lg">
                {execution.question_asked}
              </div>
            </div>

            {/* Response */}
            <div>
              <h3 className="font-semibold mb-2">Resposta do Agente</h3>
              <div 
                className="p-4 bg-muted rounded-lg"
                dangerouslySetInnerHTML={{
                  __html: highlightPatterns(
                    execution.actual_response,
                    execution.attack_patterns_matched || []
                  )
                }}
              />
            </div>

            {/* Detection Details */}
            {execution.detection_details && (
              <div>
                <h3 className="font-semibold mb-2">Análise de Segurança</h3>
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  {execution.detection_details.patterns_matched?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-500">
                        Padrões de Ataque Detectados:
                      </div>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {execution.detection_details.patterns_matched.map((pattern: string, i: number) => (
                          <li key={i}>{pattern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {execution.detection_details.suspicious_indicators?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-yellow-500">
                        Indicadores Suspeitos:
                      </div>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {execution.detection_details.suspicious_indicators.map((indicator: string, i: number) => (
                          <li key={i}>{indicator}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {execution.detection_details.analysis_summary && (
                    <div className="text-sm">
                      <strong>Resumo:</strong> {execution.detection_details.analysis_summary}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Executado em:</span>
                <div>{new Date(execution.executed_at).toLocaleString('pt-BR')}</div>
              </div>
              {execution.latency_ms && (
                <div>
                  <span className="text-muted-foreground">Latência:</span>
                  <div>{execution.latency_ms}ms</div>
                </div>
              )}
              {execution.tokens_used && (
                <div>
                  <span className="text-muted-foreground">Tokens:</span>
                  <div>{execution.tokens_used}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onRetest?.(execution.id)}
              >
                <RefreshCw className="h-4 w-4" />
                Re-executar Teste
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
