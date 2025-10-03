import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeletePendingExecutions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const { data: pendingExecutions, error: fetchError } = await supabase
        .from('test_executions')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending');

      if (fetchError) throw fetchError;

      const count = pendingExecutions?.length || 0;

      if (count === 0) {
        return { count: 0 };
      }

      const { error: deleteError } = await supabase
        .from('test_executions')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending');

      if (deleteError) throw deleteError;

      return { count };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['test-executions'] });
      queryClient.invalidateQueries({ queryKey: ['execution-metrics'] });
      
      if (data.count === 0) {
        toast.info('Nenhuma execução pendente encontrada');
      } else {
        toast.success(`${data.count} execução(ões) pendente(s) removida(s)`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover execuções pendentes: ${error.message}`);
    },
  });
};
