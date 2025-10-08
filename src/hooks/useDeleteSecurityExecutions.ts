import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteSecurityExecutions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const { error } = await supabase
        .from('security_test_executions')
        .delete()
        .eq('workspace_id', workspaceId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['security-test-executions', variables.workspaceId] });
      toast.success('Execuções de segurança limpas com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao limpar execuções: ${error.message}`);
    },
  });
};
