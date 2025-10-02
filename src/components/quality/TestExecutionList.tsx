import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTestExecutions } from "@/hooks/useTestExecutions";
import { Eye, Clock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TestExecutionDetail } from "./TestExecutionDetail";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./StatusBadge";
import { ScoreDisplay } from "./ScoreDisplay";

interface TestExecutionListProps {
  tenantId: string;
}

export function TestExecutionList({ tenantId }: TestExecutionListProps) {
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const { data: executions, isLoading } = useTestExecutions(tenantId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!executions || executions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma execução ainda</h3>
          <p className="text-muted-foreground text-sm">
            As execuções de teste aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Pergunta</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Scores</TableHead>
              <TableHead className="font-semibold">Performance</TableHead>
              <TableHead className="font-semibold">Executado em</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution, index) => (
              <TableRow 
                key={execution.id} 
                className="hover:bg-accent/5 transition-colors cursor-pointer group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TableCell className="font-medium max-w-[300px]">
                  <div className="truncate">{execution.question_asked}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={execution.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <ScoreDisplay score={execution.similarity_score} size="sm" />
                      <div className="text-xs text-muted-foreground">Sim</div>
                    </div>
                    <div className="text-center">
                      <ScoreDisplay score={execution.factual_accuracy} size="sm" />
                      <div className="text-xs text-muted-foreground">Acc</div>
                    </div>
                    <div className="text-center">
                      <ScoreDisplay score={execution.relevance_score} size="sm" />
                      <div className="text-xs text-muted-foreground">Rel</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{execution.latency_ms ? `${(execution.latency_ms / 1000).toFixed(2)}s` : '-'}</span>
                    </div>
                    {execution.cost_usd !== null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        <span>${execution.cost_usd.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(execution.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedExecutionId(execution.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedExecutionId && (
        <TestExecutionDetail 
          executionId={selectedExecutionId}
          open={!!selectedExecutionId}
          onOpenChange={(open) => !open && setSelectedExecutionId(null)}
        />
      )}
    </>
  );
}
