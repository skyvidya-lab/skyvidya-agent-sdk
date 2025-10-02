import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateReportData {
  workspace_id: string;
  agent_id: string;
  report_types: ('knowledge_base' | 'system_prompt')[];
  min_score_threshold?: number;
  analysis_period_days?: number;
}

export const useGenerateImprovementReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateReportData) => {
      const { data: result, error } = await supabase.functions.invoke('generate-improvement-report', {
        body: data,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['improvement-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-improvement-reports'] });

      toast.success(result.message || 'Relatórios gerados com sucesso', {
        description: 'Aguardando revisão humana',
        action: {
          label: 'Ver Relatórios',
          onClick: () => {
            // Navigation will be handled by the component
          },
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar relatórios: ${error.message}`);
    },
  });
};
