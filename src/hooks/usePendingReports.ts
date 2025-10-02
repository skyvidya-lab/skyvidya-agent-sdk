import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePendingReports = (workspaceId: string) => {
  return useQuery({
    queryKey: ['pending-improvement-reports', workspaceId],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('improvement_reports')
        .select('id, agent_id, report_type, generated_at', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('review_status', 'pending_review')
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return { reports: data || [], count: count || 0 };
    },
    enabled: !!workspaceId,
    refetchInterval: 30000, // Poll every 30s
  });
};
