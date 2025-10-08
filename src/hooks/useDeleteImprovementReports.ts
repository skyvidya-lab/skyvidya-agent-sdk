import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteImprovementReports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const { error } = await supabase
        .from('improvement_reports')
        .delete()
        .eq('workspace_id', workspaceId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['improvement-reports', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['pending-improvement-reports', variables.workspaceId] });
      toast.success('Relatórios de melhoria limpos com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao limpar relatórios: ${error.message}`);
    },
  });
};
