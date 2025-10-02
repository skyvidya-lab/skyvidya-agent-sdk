import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { useBatchExecutionProgress } from "@/hooks/useBatchExecutionProgress";
import { Clock, TrendingUp, Target, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BatchProgressDialogProps {
  batchId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BatchProgressDialog = ({ batchId, open, onOpenChange }: BatchProgressDialogProps) => {
  const { progress, isLoading, percentComplete, successRate, canClose } = useBatchExecutionProgress(batchId);

  if (isLoading || !progress) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Aguarde enquanto carregamos as informações da execução...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDuration = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: false,
        locale: ptBR 
      });
    } catch {
      return '-';
    }
  };

  const calculateSpeed = () => {
    if (!progress.started_at || progress.completed_tests === 0) return 0;
    const elapsedMinutes = (Date.now() - new Date(progress.started_at).getTime()) / 60000;
    return elapsedMinutes > 0 ? Math.round(progress.completed_tests / elapsedMinutes) : 0;
  };

  const handleClose = () => {
    if (canClose) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : () => {}}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => !canClose && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Execução em Lote em Andamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <StatusBadge status={progress.status as any} />
            <span className="text-sm text-muted-foreground">
              {progress.completed_tests} / {progress.total_tests} testes
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={percentComplete} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">
                ✓ {progress.successful_tests} sucessos
              </span>
              <span className="font-semibold">
                {percentComplete}%
              </span>
              <span className="text-red-600 font-medium">
                ✗ {progress.failed_tests} falhas
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Tempo Decorrido</div>
                    <div className="text-sm font-semibold">
                      {progress.started_at ? formatDuration(progress.started_at) : '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Tempo Estimado</div>
                    <div className="text-sm font-semibold">
                      {progress.estimated_completion ? formatDuration(progress.estimated_completion) : '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
                    <div className="text-sm font-semibold">
                      {successRate}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Velocidade</div>
                    <div className="text-sm font-semibold">
                      {calculateSpeed()} testes/min
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Log */}
          {progress.error_log && progress.error_log.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Log de Execução</div>
              <ScrollArea className="h-40 border rounded-lg p-3 bg-muted/30">
                <div className="space-y-1">
                  {progress.error_log.slice(-10).reverse().map((log, i) => (
                    <div key={i} className="text-xs font-mono">
                      <span className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      {' '}
                      <span className={log.level === 'error' ? 'text-destructive' : ''}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {canClose && (
              <Button onClick={handleClose}>
                Fechar
              </Button>
            )}
            {!canClose && (
              <Button variant="outline" disabled>
                Aguarde a conclusão...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
