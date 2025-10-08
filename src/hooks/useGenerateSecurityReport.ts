import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateSecurityReportParams {
  workspace_id: string;
  agent_id: string;
  period_start?: string;
  period_end?: string;
}

export const useGenerateSecurityReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateSecurityReportParams) => {
      const { data, error } = await supabase.functions.invoke('generate-security-compliance-report', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['security-compliance-reports', variables.workspace_id] 
      });
      toast.success(`Relatório de compliance gerado com score de ${data.compliance_score}%`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar relatório: ${error.message}`);
    },
  });
};
