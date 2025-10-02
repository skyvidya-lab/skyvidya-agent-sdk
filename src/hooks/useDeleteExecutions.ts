import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteExecutions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, executionIds }: { workspaceId: string; executionIds?: string[] }) => {
      let query = supabase
        .from('test_executions')
        .delete()
        .eq('workspace_id', workspaceId);

      // If specific execution IDs are provided, delete only those
      if (executionIds && executionIds.length > 0) {
        query = query.in('id', executionIds);
      }

      const { error } = await query;
      if (error) throw error;

      return { deletedCount: executionIds?.length || 'all' };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-executions', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['execution-metrics', variables.workspaceId] });
      
      const message = data.deletedCount === 'all' 
        ? 'Histórico de execuções limpo com sucesso'
        : `${data.deletedCount} execução(ões) removida(s) com sucesso`;
      
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover execuções: ${error.message}`);
    },
  });
};
