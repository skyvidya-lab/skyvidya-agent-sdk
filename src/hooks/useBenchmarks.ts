import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Benchmark {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  agent_ids: string[];
  test_case_ids: string[];
  results: any;
  created_by: string | null;
  created_at: string;
}

export const useBenchmarks = (workspaceId: string) => {
  return useQuery({
    queryKey: ['benchmarks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Benchmark[];
    },
    enabled: !!workspaceId,
  });
};

export const useBenchmarkResults = (benchmarkId: string) => {
  return useQuery({
    queryKey: ['benchmark-results', benchmarkId],
    queryFn: async () => {
      const { data: benchmark, error: benchmarkError } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('id', benchmarkId)
        .single();

      if (benchmarkError) throw benchmarkError;

      // Fetch executions for all agents and test cases
      const { data: executions, error: executionsError } = await supabase
        .from('test_executions')
        .select(`
          *,
          agents:agent_id(id, name, platform),
          test_cases:test_case_id(id, question, category)
        `)
        .in('agent_id', benchmark.agent_ids)
        .in('test_case_id', benchmark.test_case_ids);

      if (executionsError) throw executionsError;

      // Group by agent
      const agentResults = benchmark.agent_ids.map((agentId: string) => {
        const agentExecutions = executions.filter(e => e.agent_id === agentId);
        
        if (agentExecutions.length === 0) {
          return null;
        }

        const total = agentExecutions.length;
        const avgAccuracy = agentExecutions.reduce((sum, e) => sum + (e.similarity_score || 0), 0) / total;
        const avgFactualAccuracy = agentExecutions.reduce((sum, e) => sum + (e.factual_accuracy || 0), 0) / total;
        const avgSpeed = agentExecutions.reduce((sum, e) => sum + (e.latency_ms || 0), 0) / total;
        const totalCost = agentExecutions.reduce((sum, e) => sum + (e.cost_usd || 0), 0);
        const totalTokens = agentExecutions.reduce((sum, e) => sum + (e.tokens_used || 0), 0);
        const successRate = (agentExecutions.filter(e => e.status === 'passed').length / total) * 100;

        return {
          agent_id: agentId,
          agent_name: agentExecutions[0].agents?.name || 'Unknown',
          agent_platform: agentExecutions[0].agents?.platform || 'Unknown',
          total_executions: total,
          avg_similarity_score: avgAccuracy,
          avg_factual_accuracy: avgFactualAccuracy,
          avg_speed_ms: avgSpeed,
          total_cost_usd: totalCost,
          total_tokens: totalTokens,
          success_rate: successRate,
          executions: agentExecutions,
        };
      }).filter(Boolean);

      return {
        benchmark,
        results: agentResults,
        total_executions: executions.length,
      };
    },
    enabled: !!benchmarkId,
  });
};

export const useCreateBenchmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      name,
      description,
      agentIds,
      testCaseIds,
    }: {
      workspaceId: string;
      name: string;
      description?: string;
      agentIds: string[];
      testCaseIds: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('benchmarks')
        .insert({
          workspace_id: workspaceId,
          name,
          description,
          agent_ids: agentIds,
          test_case_ids: testCaseIds,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Execute tests for all agent/testCase combinations
      const executionPromises = [];
      for (const agentId of agentIds) {
        for (const testCaseId of testCaseIds) {
          executionPromises.push(
            supabase.functions.invoke('execute-test', {
              body: {
                test_case_id: testCaseId,
                agent_id: agentId,
                workspace_id: workspaceId,
              },
            })
          );
        }
      }

      await Promise.allSettled(executionPromises);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['test-executions', variables.workspaceId] });
      toast.success('Benchmark criado e testes executados com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar benchmark: ${error.message}`);
    },
  });
};

export const useDeleteBenchmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('benchmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks', variables.workspaceId] });
      toast.success('Benchmark removido com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover benchmark: ${error.message}`);
    },
  });
};
