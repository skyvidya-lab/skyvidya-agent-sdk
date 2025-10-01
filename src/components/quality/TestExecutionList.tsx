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
import { Eye } from 'lucide-react';
import { TestExecutionDetail } from './TestExecutionDetail';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TestExecutionListProps {
  tenantId: string;
}

export const TestExecutionList = ({ tenantId }: TestExecutionListProps) => {
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  
  const { data: executions = [], isLoading } = useTestExecutions(tenantId);

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

  if (!tenantId) {
    return <div>Selecione um workspace</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma execução encontrada
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
