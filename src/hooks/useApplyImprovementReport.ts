import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface ApplyReportData {
  report_id: string;
  workspace_id: string;
  agent_id: string;
}

export const useApplyImprovementReport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ report_id, workspace_id, agent_id }: ApplyReportData) => {
      // Fetch the report
      const { data: report, error: reportError } = await supabase
        .from('improvement_reports')
        .select('*')
        .eq('id', report_id)
        .single();

      if (reportError) throw reportError;

      // Check if approved
      if (report.review_status !== 'approved') {
        throw new Error('Apenas relatórios aprovados podem ser aplicados');
      }

      // Mark as applied
      const { error: updateError } = await supabase
        .from('improvement_reports')
        .update({
          applied: true,
          applied_at: new Date().toISOString(),
          applied_by: user?.id,
        })
        .eq('id', report_id);

      if (updateError) throw updateError;

      // Record in agent_improvements
      const recommendations = (report.recommendations as any[]) || [];
      const improvements = recommendations.map((rec: any) => ({
        workspace_id,
        agent_id,
        improvement_type: report.report_type,
        reason: rec.issue,
        before_value: '',
        after_value: rec.suggested_addition,
        evidence: { recommendations: rec },
        applied_by: user?.id,
      }));

      const { error: improvementError } = await supabase
        .from('agent_improvements')
        .insert(improvements);

      if (improvementError) throw improvementError;

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvement-reports'] });
      queryClient.invalidateQueries({ queryKey: ['agent-improvements'] });
      toast.success('Relatório marcado como aplicado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aplicar relatório: ${error.message}`);
    },
  });
};
