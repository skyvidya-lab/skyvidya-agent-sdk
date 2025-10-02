import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface AgreementHeatmapProps {
  workspaceId: string;
  benchmarkId?: string;
}

export const AgreementHeatmap = ({ workspaceId, benchmarkId }: AgreementHeatmapProps) => {
  const { data: agreements = [] } = useQuery({
    queryKey: ['agreement-heatmap', workspaceId, benchmarkId],
    queryFn: async () => {
      let query = supabase
        .from('agreement_analysis')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (benchmarkId) {
        query = query.eq('benchmark_id', benchmarkId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents-for-heatmap', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, platform')
        .eq('tenant_id', workspaceId);

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  // Calculate pairwise agreement
  const calculatePairwiseAgreement = () => {
    const matrix: Record<string, Record<string, { kappa: number; count: number }>> = {};

    agents.forEach(agent1 => {
      matrix[agent1.id] = {};
      agents.forEach(agent2 => {
        if (agent1.id === agent2.id) {
          matrix[agent1.id][agent2.id] = { kappa: 1, count: 0 };
        } else {
          matrix[agent1.id][agent2.id] = { kappa: 0, count: 0 };
        }
      });
    });

    // Calculate average kappa for pairs
    agreements.forEach(agreement => {
      const agentIds = agreement.agent_ids || [];
      for (let i = 0; i < agentIds.length; i++) {
        for (let j = i + 1; j < agentIds.length; j++) {
          const id1 = agentIds[i];
          const id2 = agentIds[j];
          if (matrix[id1] && matrix[id1][id2]) {
            matrix[id1][id2].kappa += agreement.kappa_score;
            matrix[id1][id2].count++;
          }
          if (matrix[id2] && matrix[id2][id1]) {
            matrix[id2][id1].kappa += agreement.kappa_score;
            matrix[id2][id1].count++;
          }
        }
      }
    });

    // Average kappa values
    Object.keys(matrix).forEach(id1 => {
      Object.keys(matrix[id1]).forEach(id2 => {
        if (matrix[id1][id2].count > 0) {
          matrix[id1][id2].kappa = matrix[id1][id2].kappa / matrix[id1][id2].count;
        }
      });
    });

    return matrix;
  };

  const getKappaColor = (kappa: number) => {
    if (kappa >= 0.8) return 'bg-green-500';
    if (kappa >= 0.6) return 'bg-blue-500';
    if (kappa >= 0.4) return 'bg-yellow-500';
    if (kappa > 0) return 'bg-red-500';
    return 'bg-gray-300';
  };

  const getKappaOpacity = (kappa: number) => {
    if (kappa === 0) return 'opacity-10';
    if (kappa >= 0.8) return 'opacity-100';
    if (kappa >= 0.6) return 'opacity-80';
    if (kappa >= 0.4) return 'opacity-60';
    return 'opacity-40';
  };

  const matrix = calculatePairwiseAgreement();

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Concordância entre Pares</CardTitle>
          <CardDescription>Nenhum agente disponível para análise</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Concordância entre Pares de Agentes</CardTitle>
        <CardDescription>
          Heatmap mostrando o nível de concordância (Kappa) entre cada par de agentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Legenda:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>&lt; 0.4 (Baixo)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span>0.4-0.6 (Moderado)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span>0.6-0.8 (Substancial)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>&gt; 0.8 (Quase Perfeito)</span>
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-medium text-muted-foreground border-b">
                    Agente
                  </th>
                  {agents.map(agent => (
                    <th key={agent.id} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
                      <div className="rotate-[-45deg] origin-bottom-left whitespace-nowrap">
                        {agent.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map(agent1 => (
                  <tr key={agent1.id}>
                    <td className="p-2 text-xs font-medium border-r">
                      <div className="flex items-center gap-2">
                        <span>{agent1.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {agent1.platform}
                        </Badge>
                      </div>
                    </td>
                    {agents.map(agent2 => {
                      const data = matrix[agent1.id]?.[agent2.id];
                      const kappa = data?.kappa || 0;
                      const isIdentical = agent1.id === agent2.id;

                      return (
                        <td key={agent2.id} className="p-1 text-center border">
                          <div
                            className={`
                              w-12 h-12 rounded flex items-center justify-center
                              ${getKappaColor(kappa)} ${getKappaOpacity(kappa)}
                              ${isIdentical ? 'border-2 border-primary' : ''}
                            `}
                            title={`Kappa: ${kappa.toFixed(3)} (${data?.count || 0} comparações)`}
                          >
                            <span className="text-xs font-semibold text-white drop-shadow">
                              {isIdentical ? '—' : kappa > 0 ? kappa.toFixed(2) : '—'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            * A diagonal representa o mesmo agente (concordância perfeita). Valores fora da diagonal mostram
            o nível de concordância entre diferentes agentes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
