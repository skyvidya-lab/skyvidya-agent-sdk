import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Shuffle, List } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useTestCases } from '@/hooks/useTestCases';
import { useBatchExecution } from '@/hooks/useBatchExecution';
import { Checkbox } from '@/components/ui/checkbox';
import { BatchProgressDialog } from './BatchProgressDialog';

interface BatchExecutionDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BatchExecutionDialog = ({ workspaceId, open, onOpenChange }: BatchExecutionDialogProps) => {
  const [strategy, setStrategy] = useState<'random' | 'fixed' | 'all' | 'category'>('fixed');
  const [fixedCount, setFixedCount] = useState<number>(10);
  const [randomCount, setRandomCount] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);

  const { data: agents = [] } = useAgents(workspaceId);
  const { data: testCases = [] } = useTestCases(workspaceId);
  const batchExecution = useBatchExecution();

  const categories = Array.from(new Set(testCases.map(tc => tc.category)));

  const getSelectedTestCases = () => {
    let selected = testCases.filter(tc => tc.is_active);
    
    switch (strategy) {
      case 'random':
        return selected.sort(() => Math.random() - 0.5).slice(0, randomCount);
      case 'fixed':
        return selected.slice(0, fixedCount);
      case 'category':
        return selected.filter(tc => tc.category === selectedCategory);
      case 'all':
      default:
        return selected;
    }
  };

  const handleExecute = async () => {
    if (selectedAgents.length === 0) {
      return;
    }

    const selectedTests = getSelectedTestCases();
    if (selectedTests.length === 0) {
      return;
    }

    const result = await batchExecution.mutateAsync({
      workspaceId,
      agentIds: selectedAgents,
      testCaseIds: selectedTests.map(tc => tc.id),
      concurrency: 3,
    });

    // Set batch ID to open progress dialog
    setBatchId(result.batchId);
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const selectedTestsCount = getSelectedTestCases().length;

  return (
    <>
      <Dialog open={open && !batchId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Execução em Lote</DialogTitle>
          <DialogDescription>
            Configure a estratégia de seleção de testes e os agentes para execução
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Strategy Selection */}
          <div className="space-y-3">
            <Label>Estratégia de Seleção de Testes</Label>
            <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Quantidade Fixa (10, 25, 50, 100)
                  </div>
                </SelectItem>
                <SelectItem value="random">
                  <div className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4" />
                    N Casos Aleatórios
                  </div>
                </SelectItem>
                <SelectItem value="all">Todos os Casos Ativos</SelectItem>
                <SelectItem value="category">Por Categoria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strategy-specific inputs */}
          {strategy === 'fixed' && (
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <div className="flex gap-2">
                {[10, 25, 50, 100].map(count => (
                  <Button
                    key={count}
                    variant={fixedCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFixedCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {strategy === 'random' && (
            <div className="space-y-2">
              <Label>Quantidade de Casos Aleatórios</Label>
              <Input
                type="number"
                min="1"
                max={testCases.length}
                value={randomCount}
                onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {strategy === 'category' && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Agent Selection */}
          <div className="space-y-3">
            <Label>Selecionar Agentes ({selectedAgents.length} selecionados)</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedAgents.includes(agent.id)}
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                  <span className="flex-1">{agent.name}</span>
                  <Badge variant="outline">{agent.platform}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Casos selecionados:</span>
              <span className="font-semibold">{selectedTestsCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Agentes selecionados:</span>
              <span className="font-semibold">{selectedAgents.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de execuções:</span>
              <span className="font-semibold">{selectedTestsCount * selectedAgents.length}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExecute}
              disabled={selectedAgents.length === 0 || selectedTestsCount === 0 || batchExecution.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              {batchExecution.isPending ? 'Executando...' : 'Executar Testes'}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      <BatchProgressDialog 
        batchId={batchId}
        open={!!batchId}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setBatchId(null);
            onOpenChange(false);
          }
        }}
      />
    </>
  );
};
