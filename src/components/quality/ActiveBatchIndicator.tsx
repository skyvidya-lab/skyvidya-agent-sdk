import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, X } from "lucide-react";
import { useActiveBatches } from "@/hooks/useActiveBatches";
import { BatchProgressDialog } from "./BatchProgressDialog";
import { Card } from "@/components/ui/card";

interface ActiveBatchIndicatorProps {
  workspaceId: string;
}

export const ActiveBatchIndicator = ({ workspaceId }: ActiveBatchIndicatorProps) => {
  const { data: activeBatches = [] } = useActiveBatches(workspaceId);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBatchId(latestBatch.id)}
          >
            Ver Detalhes
          </Button>
        </div>
      </Card>

      <BatchProgressDialog
        batchId={selectedBatchId}
        open={!!selectedBatchId}
        onOpenChange={(isOpen) => !isOpen && setSelectedBatchId(null)}
      />
    </>
  );
};
