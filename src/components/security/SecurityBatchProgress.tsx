import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BatchProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  warnings: number;
  currentAgent?: string;
  currentTest?: string;
}

interface SecurityBatchProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: BatchProgress;
  isExecuting: boolean;
}

export function SecurityBatchProgress({
  open,
  onOpenChange,
  progress,
  isExecuting,
}: SecurityBatchProgressProps) {
  const percentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isExecuting ? 'Executando Testes de Segurança...' : 'Execução Concluída'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {progress.completed} de {progress.total} testes
              </span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Current Execution Info */}
          {isExecuting && progress.currentAgent && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Executando agora:</span>
              </div>
              <div className="text-sm text-muted-foreground ml-6">
                <div>Agente: {progress.currentAgent}</div>
                <div>Teste: {progress.currentTest}</div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{progress.successful}</div>
                <div className="text-xs text-muted-foreground">Passaram</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{progress.warnings}</div>
                <div className="text-xs text-muted-foreground">Avisos</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{progress.failed}</div>
                <div className="text-xs text-muted-foreground">Falharam</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              variant={isExecuting ? "outline" : "default"}
              onClick={() => onOpenChange(false)}
              disabled={isExecuting}
            >
              {isExecuting ? 'Fechar após conclusão' : 'Fechar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
