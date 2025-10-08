import { AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCleanupDuplicateTests } from "@/hooks/useCleanupDuplicateTests";

interface CleanupDuplicatesButtonProps {
  workspaceId: string;
}

export function CleanupDuplicatesButton({ workspaceId }: CleanupDuplicatesButtonProps) {
  const cleanupMutation = useCleanupDuplicateTests();

  const handleCleanup = () => {
    cleanupMutation.mutate({ workspaceId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={cleanupMutation.isPending}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Limpar Duplicatas
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar Casos de Teste Duplicados</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta ação irá remover todos os casos de teste de segurança duplicados 
              neste workspace, mantendo apenas a versão mais antiga de cada caso.
            </p>
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Isso não afetará os resultados de execução já existentes, apenas 
                removerá os casos de teste duplicados.
              </span>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCleanup}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Duplicatas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
