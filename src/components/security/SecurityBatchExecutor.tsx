import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Play, Settings } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useTestCases } from '@/hooks/useTestCases';
import { useSecurityBatchExecution } from '@/hooks/useSecurityBatchExecution';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { SecurityBatchProgress } from './SecurityBatchProgress';

interface SecurityBatchExecutorProps {
  workspaceId: string;
}

export function SecurityBatchExecutor({ workspaceId }: SecurityBatchExecutorProps) {
  const [open, setOpen] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [intervalMs, setIntervalMs] = useState(1000);
  const [showProgress, setShowProgress] = useState(false);

  const { data: agents } = useAgents(workspaceId);
  const { data: testCases } = useTestCases(workspaceId);
  const { mutate: executeBatch, progress, isExecuting } = useSecurityBatchExecution();

  const securityTests = testCases?.filter(tc => (tc as any).test_type === 'security') || [];
  const activeAgents = agents?.filter(a => a.status === 'active') || [];

  const totalExecutions = selectedAgents.length * selectedTests.length;

  const handleExecute = () => {
    if (selectedAgents.length === 0 || selectedTests.length === 0) {
      return;
    }

    setOpen(false);
    setShowProgress(true);

    executeBatch({
      workspace_id: workspaceId,
      agent_ids: selectedAgents,
      test_case_ids: selectedTests,
      interval_ms: intervalMs,
    });
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const toggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const selectAllAgents = () => {
    setSelectedAgents(activeAgents.map(a => a.id));
  };

  const selectAllTests = () => {
    setSelectedTests(securityTests.map(t => t.id));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Play className="h-4 w-4" />
            Executar Batch de Segurança
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Configurar Execução em Lote</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Agents Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Agentes ({selectedAgents.length} selecionados)</Label>
                <Button variant="ghost" size="sm" onClick={selectAllAgents}>
                  Selecionar Todos
                </Button>
              </div>
              <ScrollArea className="h-[300px] border rounded-md p-4">
                {activeAgents.map(agent => (
                  <div key={agent.id} className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      checked={selectedAgents.includes(agent.id)}
                      onCheckedChange={() => toggleAgent(agent.id)}
                    />
                    <Label className="cursor-pointer flex-1">
                      {agent.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        {agent.platform}
                      </span>
                    </Label>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Tests Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Testes ({selectedTests.length} selecionados)</Label>
                <Button variant="ghost" size="sm" onClick={selectAllTests}>
                  Selecionar Todos
                </Button>
              </div>
              <ScrollArea className="h-[300px] border rounded-md p-4">
                {securityTests.map(test => (
                  <div key={test.id} className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      checked={selectedTests.includes(test.id)}
                      onCheckedChange={() => toggleTest(test.id)}
                    />
                    <Label className="cursor-pointer flex-1 text-xs">
                      <div className="font-medium">{(test as any).attack_category || test.category}</div>
                      <div className="text-muted-foreground truncate">
                        {test.question.substring(0, 60)}...
                      </div>
                    </Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-4">
              <Settings className="h-4 w-4" />
              <Label>Configurações</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interval">Intervalo entre testes (ms)</Label>
                <Input
                  id="interval"
                  type="number"
                  min={100}
                  max={5000}
                  value={intervalMs}
                  onChange={(e) => setIntervalMs(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  Total de execuções: <strong>{totalExecutions}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExecute}
              disabled={selectedAgents.length === 0 || selectedTests.length === 0}
            >
              Iniciar Execução
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SecurityBatchProgress
        open={showProgress}
        onOpenChange={setShowProgress}
        progress={progress}
        isExecuting={isExecuting}
      />
    </>
  );
}
