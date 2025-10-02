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
      const { data, error } = await supabase.functions.invoke('batch-execute-tests', {
        body: {
          workspace_id: config.workspaceId,
          agent_ids: config.agentIds,
          test_case_ids: config.testCaseIds,
          concurrency: config.concurrency || 3,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-executions', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['execution-metrics', variables.workspaceId] });
      toast.success(data.message || 'Execução em lote concluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro na execução em lote: ${error.message}`);
    },
  });
};
