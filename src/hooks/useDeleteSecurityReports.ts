import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteSecurityReports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const { error } = await supabase
        .from('security_compliance_reports')
        .delete()
        .eq('workspace_id', workspaceId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['security-compliance-reports', variables.workspaceId] });
      toast.success('Relatórios de compliance limpos com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao limpar relatórios: ${error.message}`);
    },
  });
};
