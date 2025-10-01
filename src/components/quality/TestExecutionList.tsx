import { useState } from 'react';
import { useTestExecutions } from '@/hooks/useTestExecutions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Play } from 'lucide-react';
import { TestExecutionDetail } from './TestExecutionDetail';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TestExecutionListProps {
  tenantId: string;
}

export const TestExecutionList = ({ tenantId }: TestExecutionListProps) => {
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  
  const { data: executions = [], isLoading } = useTestExecutions(tenantId);

  if (!tenantId) {
    return <div className="text-center py-8 text-muted-foreground">Selecione um tenant para visualizar o histórico de execuções</div>;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      passed: 'bg-green-500/10 text-green-700 dark:text-green-400',
      failed: 'bg-red-500/10 text-red-700 dark:text-red-400',
      warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      pending: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    };
    return colors[status] || colors.pending;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Carregando histórico de execuções...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Nenhuma execução realizada</h3>
                  <p className="text-muted-foreground">
                    Execute casos de teste para visualizar o histórico e análise de resultados.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Similaridade</TableHead>
                  <TableHead>Acurácia</TableHead>
                  <TableHead>Latência</TableHead>
                  <TableHead>Executado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="max-w-md truncate">
                      {execution.question_asked}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={getScoreColor(execution.similarity_score)}>
                        {execution.similarity_score ? `${execution.similarity_score.toFixed(1)}%` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={getScoreColor(execution.factual_accuracy)}>
                        {execution.factual_accuracy ? `${execution.factual_accuracy.toFixed(1)}%` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {execution.latency_ms ? `${execution.latency_ms}ms` : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(execution.executed_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedExecutionId(execution.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedExecutionId && (
        <TestExecutionDetail
          executionId={selectedExecutionId}
          open={!!selectedExecutionId}
          onOpenChange={(open) => !open && setSelectedExecutionId(null)}
        />
      )}
    </>
  );
};
