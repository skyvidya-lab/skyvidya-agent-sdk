import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, X } from "lucide-react";
import { useActiveBatches } from "@/hooks/useActiveBatches";
import { BatchProgressDialog } from "./BatchProgressDialog";
import { Card } from "@/components/ui/card";
import { useCancelBatchExecution } from "@/hooks/useCancelBatchExecution";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActiveBatchIndicatorProps {
  workspaceId: string;
}

export const ActiveBatchIndicator = ({ workspaceId }: ActiveBatchIndicatorProps) => {
  const { data: activeBatches = [] } = useActiveBatches(workspaceId);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const cancelMutation = useCancelBatchExecution();

  if (activeBatches.length === 0) return null;

  const latestBatch = activeBatches[0];
  const progress = latestBatch.total_tests > 0 
    ? (latestBatch.completed_tests / latestBatch.total_tests) * 100 
    : 0;

  return (
    <>
      <Card className="p-4 border-primary/20 bg-primary/5 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Execução em lote em andamento
                </p>
                <span className="text-xs text-muted-foreground">
                  {latestBatch.completed_tests} / {latestBatch.total_tests} testes
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {latestBatch.successful_tests} sucessos • {latestBatch.failed_tests} falhas
                </span>
                <span>{progress.toFixed(0)}%</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBatchId(latestBatch.id)}
            >
              Ver Detalhes
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Execução em Lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja cancelar esta execução? Os testes já concluídos 
              serão mantidos, mas os testes restantes não serão executados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, continuar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelMutation.mutate(latestBatch.id);
                setShowCancelDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BatchProgressDialog
        batchId={selectedBatchId}
        open={!!selectedBatchId}
        onOpenChange={(isOpen) => !isOpen && setSelectedBatchId(null)}
      />
    </>
  );
};
