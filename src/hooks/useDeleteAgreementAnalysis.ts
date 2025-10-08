import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteAgreementAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const { error } = await supabase
        .from('agreement_analysis')
        .delete()
        .eq('workspace_id', workspaceId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreement-analysis', variables.workspaceId] });
      toast.success('Análises de concordância limpas com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao limpar análises: ${error.message}`);
    },
  });
};
