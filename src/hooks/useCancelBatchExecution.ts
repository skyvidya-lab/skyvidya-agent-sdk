import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCancelBatchExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('batch_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) throw error;

      return { batchId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-batches'] });
      queryClient.invalidateQueries({ queryKey: ['batch-execution', data.batchId] });
      toast.success('Execução cancelada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar execução: ${error.message}`);
    },
  });
};
