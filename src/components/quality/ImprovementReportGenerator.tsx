import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useGenerateImprovementReport } from '@/hooks/useGenerateImprovementReport';
import { Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ImprovementReportGeneratorProps {
  workspaceId: string;
}

export const ImprovementReportGenerator = ({ workspaceId }: ImprovementReportGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [reportTypes, setReportTypes] = useState<('knowledge_base' | 'system_prompt')[]>([
    'knowledge_base',
    'system_prompt',
  ]);
  const [minScore, setMinScore] = useState('70');
  const [periodDays, setPeriodDays] = useState('30');

  const generateReport = useGenerateImprovementReport();

  const { data: agents, isLoading: isLoadingAgents, error: agentsError } = useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, avatar_url')
        .eq('tenant_id', workspaceId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
    retry: 1,
  });

  const handleGenerate = () => {
    if (!selectedAgent) return;

    generateReport.mutate(
      {
        workspace_id: workspaceId,
        agent_id: selectedAgent,
        report_types: reportTypes,
        min_score_threshold: parseInt(minScore),
        analysis_period_days: parseInt(periodDays),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelectedAgent('');
        },
      }
    );
  };

  const toggleReportType = (type: 'knowledge_base' | 'system_prompt') => {
    if (reportTypes.includes(type)) {
      setReportTypes(reportTypes.filter((t) => t !== type));
    } else {
      setReportTypes([...reportTypes, type]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar Relatório de Melhoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Melhoria</DialogTitle>
          <DialogDescription>
            Analise execuções falhadas e gere recomendações acionáveis para aprimorar seu agente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Selection */}
          <div className="space-y-2">
            <Label>Agente</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isLoadingAgents}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingAgents ? "Carregando..." : agentsError ? "Erro ao carregar" : "Selecione um agente"} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200] bg-popover" sideOffset={5}>
                {agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {agentsError && (
              <p className="text-xs text-destructive">Erro ao carregar agentes. Tente novamente.</p>
            )}
          </div>

          {/* Report Types */}
          <div className="space-y-2">
            <Label>Tipos de Relatório</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kb"
                  checked={reportTypes.includes('knowledge_base')}
                  onCheckedChange={() => toggleReportType('knowledge_base')}
                />
                <label htmlFor="kb" className="text-sm cursor-pointer">
                  Base de Conhecimento - Conteúdo para adicionar
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sp"
                  checked={reportTypes.includes('system_prompt')}
                  onCheckedChange={() => toggleReportType('system_prompt')}
                />
                <label htmlFor="sp" className="text-sm cursor-pointer">
                  System Prompt - Sugestões de refatoração
                </label>
              </div>
            </div>
          </div>

          {/* Score Threshold */}
          <div className="space-y-2">
            <Label>Score Mínimo (%)</Label>
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200] bg-popover" sideOffset={5}>
                <SelectItem value="50">50% - Muito Baixo</SelectItem>
                <SelectItem value="60">60% - Baixo</SelectItem>
                <SelectItem value="70">70% - Médio</SelectItem>
                <SelectItem value="80">80% - Alto</SelectItem>
                <SelectItem value="90">90% - Muito Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Analysis Period */}
          <div className="space-y-2">
            <Label>Período de Análise</Label>
            <Select value={periodDays} onValueChange={setPeriodDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200] bg-popover" sideOffset={5}>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generateReport.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={!selectedAgent || reportTypes.length === 0 || generateReport.isPending}>
            {generateReport.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Relatórios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
