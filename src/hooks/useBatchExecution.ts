import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BatchExecutionConfig {
  workspaceId: string;
  agentIds: string[];
  testCaseIds: string[];
  concurrency?: number;
}

export const useBatchExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: BatchExecutionConfig) => {
      const totalTests = config.agentIds.length * config.testCaseIds.length;

      // 1. Create batch_execution record
      const { data: batch, error: batchError } = await supabase
        .from('batch_executions')
        .insert({
          workspace_id: config.workspaceId,
          agent_ids: config.agentIds,
          test_case_ids: config.testCaseIds,
          total_tests: totalTests,
          status: 'pending'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // 2. Invoke edge function with batch_id
      const { error: invokeError } = await supabase.functions.invoke('batch-execute-tests', {
        body: {
          batch_id: batch.id,
          workspace_id: config.workspaceId,
          agent_ids: config.agentIds,
          test_case_ids: config.testCaseIds,
          concurrency: config.concurrency || 3,
        },
      });

      if (invokeError) throw invokeError;

      // 3. Return batch_id for progress tracking
      return { batchId: batch.id };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-executions', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['execution-metrics', variables.workspaceId] });
      toast.success('Execução em lote iniciada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao iniciar execução em lote: ${error.message}`);
    },
  });
};
