import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgreementAnalysis {
  id: string;
  workspace_id: string;
  benchmark_id: string | null;
  test_case_id: string;
  agent_ids: string[];
  kappa_score: number;
  interpretation: string;
  consensus_category: string;
  disagreement_level: string;
  requires_human_review: boolean;
  human_review_completed: boolean;
  human_review_notes: string | null;
  evidence: any;
  created_at: string;
}

export const useAgreementAnalysis = (workspaceId: string, benchmarkId?: string) => {
  return useQuery({
    queryKey: ['agreement-analysis', workspaceId, benchmarkId],
    queryFn: async () => {
      let query = supabase
        .from('agreement_analysis')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (benchmarkId) {
        query = query.eq('benchmark_id', benchmarkId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AgreementAnalysis[];
    },
    enabled: !!workspaceId,
  });
};

export const useCalculateAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      benchmarkId,
      testCaseIds,
      agentIds,
    }: {
      workspaceId: string;
      benchmarkId?: string;
      testCaseIds: string[];
      agentIds: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('calculate-agreement', {
        body: {
          workspace_id: workspaceId,
          benchmark_id: benchmarkId,
          test_case_ids: testCaseIds,
          agent_ids: agentIds,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreement-analysis', variables.workspaceId] });
      toast.success(`Análise de concordância concluída: Kappa médio ${data.summary.avg_kappa.toFixed(3)}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao calcular concordância: ${error.message}`);
    },
  });
};

export const useUpdateHumanReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      workspaceId,
      notes,
    }: {
      id: string;
      workspaceId: string;
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('agreement_analysis')
        .update({
          human_review_completed: true,
          human_review_notes: notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreement-analysis', variables.workspaceId] });
      toast.success('Revisão humana registrada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar revisão: ${error.message}`);
    },
  });
};
