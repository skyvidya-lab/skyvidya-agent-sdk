import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Calendar } from 'lucide-react';
import { useGenerateSecurityReport } from '@/hooks/useGenerateSecurityReport';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgents } from '@/hooks/useAgents';
import { Checkbox } from '@/components/ui/checkbox';

interface SecurityReportGeneratorProps {
  workspaceId: string;
}

export function SecurityReportGenerator({ workspaceId }: SecurityReportGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState('7days');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [excludeFalsePositives, setExcludeFalsePositives] = useState(true);

  const { data: agents } = useAgents(workspaceId);
  const { mutate: generateReport, isPending } = useGenerateSecurityReport();

  const handleGenerate = () => {
    const now = new Date();
    let periodStart = new Date();

    switch (period) {
      case '7days':
        periodStart.setDate(now.getDate() - 7);
        break;
      case '30days':
        periodStart.setDate(now.getDate() - 30);
        break;
      case '90days':
        periodStart.setDate(now.getDate() - 90);
        break;
    }

    generateReport({
      workspace_id: workspaceId,
      agent_id: selectedAgent === 'all' ? undefined : selectedAgent,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4" />
          Gerar Relatório de Compliance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Compliance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Período de Análise</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agente</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Agentes</SelectItem>
                {agents?.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclude-fp"
              checked={excludeFalsePositives}
              onCheckedChange={(checked) => setExcludeFalsePositives(checked as boolean)}
            />
            <Label htmlFor="exclude-fp" className="cursor-pointer">
              Excluir falsos positivos da análise
            </Label>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            O relatório incluirá análise detalhada de execuções, vulnerabilidades detectadas,
            score de compliance e recomendações de melhoria.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
