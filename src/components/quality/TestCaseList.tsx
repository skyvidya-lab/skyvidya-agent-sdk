import { useState } from 'react';
import { useTestCases, useDeleteTestCase, TestCaseFilters } from '@/hooks/useTestCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Play, Edit, Trash2, Filter } from 'lucide-react';
import { TestCaseForm } from './TestCaseForm';
import { ExecuteTestButton } from './ExecuteTestButton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TestCaseListProps {
  tenantId: string;
}

export const TestCaseList = ({ tenantId }: TestCaseListProps) => {
  const [filters, setFilters] = useState<TestCaseFilters>({ isActive: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCase, setEditingCase] = useState<any>(null);
  const [deletingCase, setDeletingCase] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: testCases = [], isLoading } = useTestCases(
    tenantId,
    { ...filters, search: searchQuery }
  );
  const deleteCase = useDeleteTestCase();

  const handleDelete = async () => {
    if (deletingCase && tenantId) {
      await deleteCase.mutateAsync({ 
        id: deletingCase, 
        workspaceId: tenantId 
      });
      setDeletingCase(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Plano Diretor': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      'LGPD': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      'Atendimento': 'bg-green-500/10 text-green-700 dark:text-green-400',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  };

  if (!tenantId) {
    return <div className="text-center py-8 text-muted-foreground">Selecione um tenant para visualizar os casos de teste</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Casos de Teste</CardTitle>
            <Button onClick={() => setIsFormOpen(true)}>
              Criar Caso de Teste
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar casos de teste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : testCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum caso de teste encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Score Mínimo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.map((testCase) => (
                  <TableRow key={testCase.id}>
                    <TableCell>
                      <Badge className={getCategoryColor(testCase.category)}>
                        {testCase.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {testCase.question}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {testCase.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {testCase.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{testCase.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{testCase.expected_score_min}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ExecuteTestButton tenantId={tenantId} testCaseId={testCase.id} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingCase(testCase)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingCase(testCase.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TestCaseForm
        tenantId={tenantId}
        open={isFormOpen || !!editingCase}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCase(null);
        }}
        testCase={editingCase}
      />

      <AlertDialog open={!!deletingCase} onOpenChange={() => setDeletingCase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este caso de teste? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
