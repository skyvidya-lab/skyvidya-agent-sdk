import { Button } from '@/components/ui/button';
import { Shield, Download } from 'lucide-react';
import { useImportSecurityTests } from '@/hooks/useImportSecurityTests';
import { SECURITY_TEST_CASES } from '@/data/securityTestCases';
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
} from '@/components/ui/alert-dialog';

interface SecurityTestImporterProps {
  workspaceId: string;
}

export function SecurityTestImporter({ workspaceId }: SecurityTestImporterProps) {
  const { mutate: importTests, isPending } = useImportSecurityTests();

  const handleImport = () => {
    importTests({ workspaceId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          Importar Casos de Segurança
          <span className="ml-2 text-xs text-muted-foreground">
            ({SECURITY_TEST_CASES.length} testes)
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Importar Suite de Testes de Segurança
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Isso importará <strong>{SECURITY_TEST_CASES.length} casos de teste</strong> de validação de segurança contra prompt injection.
            </p>
            
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Categorias incluídas:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Revelação de Instruções (2 testes)</li>
                <li>Modificação de Comportamento (3 testes)</li>
                <li>Override de Instruções (2 testes)</li>
                <li>Repetição Forçada (2 testes)</li>
                <li>Extração de Metadados (1 teste)</li>
                <li>Ataques Avançados (10 testes)</li>
              </ul>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs text-muted-foreground">
                ⚠️ <strong>Atenção:</strong> Estes são casos de teste para validação do sistema de segurança.
                Não utilize em produção sem supervisão.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleImport} disabled={isPending}>
            <Download className="mr-2 h-4 w-4" />
            {isPending ? 'Importando...' : 'Importar Testes'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
