import { useState } from 'react';
import { useExecuteTest } from '@/hooks/useTestExecutions';
import { useAgents } from '@/hooks/useAgents';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play } from 'lucide-react';

interface ExecuteTestButtonProps {
  tenantId: string;
  testCaseId: string;
}

export const ExecuteTestButton = ({ tenantId, testCaseId }: ExecuteTestButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const { data: agents = [] } = useAgents(tenantId);
  const executeTest = useExecuteTest();

  const handleExecute = async () => {
    if (!tenantId || !selectedAgentId) return;

    await executeTest.mutateAsync({
      testCaseId,
      agentId: selectedAgentId,
      workspaceId: tenantId,
    });

    setOpen(false);
    setSelectedAgentId('');
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Play className="h-3 w-3" />
        Executar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Executar Teste</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Selecione o Agente
              </label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um agente..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.platform})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleExecute} 
                disabled={!selectedAgentId || executeTest.isPending}
              >
                {executeTest.isPending ? 'Executando...' : 'Executar Teste'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
