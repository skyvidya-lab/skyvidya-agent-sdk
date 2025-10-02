import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

type ReviewAction = 'approved' | 'rejected' | 'requires_changes' | 'under_review';

interface ReviewReportData {
  report_id: string;
  action: ReviewAction;
  review_notes?: string;
  edited_recommendations?: any;
}

export const useReviewImprovementReport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ report_id, action, review_notes, edited_recommendations }: ReviewReportData) => {
      const updateData: any = {
        review_status: action,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes,
      };

      if (edited_recommendations) {
        updateData.recommendations = edited_recommendations;
      }

      const { data, error } = await supabase
        .from('improvement_reports')
        .update(updateData)
        .eq('id', report_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['improvement-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-improvement-reports'] });

      const actionMessages = {
        approved: 'Relatório aprovado com sucesso',
        rejected: 'Relatório rejeitado',
        requires_changes: 'Relatório marcado para revisão',
        under_review: 'Relatório em análise',
      };

      toast.success(actionMessages[variables.action]);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao revisar relatório: ${error.message}`);
    },
  });
};
