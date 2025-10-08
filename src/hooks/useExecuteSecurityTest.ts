import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExecuteSecurityTestParams {
  workspace_id: string;
  agent_id: string;
  test_case_id: string;
  question: string;
  detection_patterns: string[];
  severity: string;
  attack_category: string;
}

export const useExecuteSecurityTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ExecuteSecurityTestParams) => {
      const { data, error } = await supabase.functions.invoke('execute-security-test', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['security-test-executions', variables.workspace_id] 
      });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao executar teste de segurança: ${error.message}`);
    },
  });
};
