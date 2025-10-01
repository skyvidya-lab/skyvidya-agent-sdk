import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CognitiveInsight {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  insight_type: 'gap' | 'pattern' | 'recommendation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: any;
  recommendations: string[];
  generated_at: string;
}

export const useCognitiveInsights = (workspaceId: string, agentId?: string) => {
  return useQuery({
    queryKey: ['cognitive-insights', workspaceId, agentId],
    queryFn: async () => {
      let query = supabase
        .from('cognitive_insights')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('generated_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CognitiveInsight[];
    },
    enabled: !!workspaceId,
  });
};

export const useGenerateInsights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      agentId,
    }: {
      workspaceId: string;
      agentId: string;
    }) => {
      // Call edge function to generate insights
      const { data, error } = await supabase.functions.invoke('generate-cognitive-insights', {
        body: {
          workspace_id: workspaceId,
          agent_id: agentId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-insights', variables.workspaceId] });
      toast.success('Insights cognitivos gerados com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar insights: ${error.message}`);
    },
  });
};

export const useInsightsByType = (workspaceId: string, insightType: 'gap' | 'pattern' | 'recommendation') => {
  return useQuery({
    queryKey: ['cognitive-insights', workspaceId, insightType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cognitive_insights')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('insight_type', insightType)
        .order('severity', { ascending: true })
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data as CognitiveInsight[];
    },
    enabled: !!workspaceId,
  });
};

export const useCriticalInsights = (workspaceId: string) => {
  return useQuery({
    queryKey: ['cognitive-insights', workspaceId, 'critical'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cognitive_insights')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('severity', ['critical', 'high'])
        .order('severity', { ascending: true })
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CognitiveInsight[];
    },
    enabled: !!workspaceId,
  });
};
