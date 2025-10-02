import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImprovementReport {
  id: string;
  workspace_id: string;
  agent_id: string;
  report_type: 'knowledge_base' | 'system_prompt';
  analysis_period_start: string | null;
  analysis_period_end: string | null;
  failed_executions_analyzed: number;
  min_score_threshold: number | null;
  summary: string | null;
  recommendations: any;
  full_report: any;
  review_status: 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'requires_changes';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  original_recommendations: any | null;
  human_edited: boolean;
  applied: boolean;
  applied_at: string | null;
  applied_by: string | null;
  generated_at: string;
  generated_by: string | null;
  updated_at: string | null;
}

interface UseImprovementReportsFilters {
  workspace_id: string;
  agent_id?: string;
  report_type?: 'knowledge_base' | 'system_prompt';
  review_status?: string;
}

export const useImprovementReports = (filters: UseImprovementReportsFilters) => {
  return useQuery({
    queryKey: ['improvement-reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('improvement_reports')
        .select(`
          *,
          agents (name, avatar_url)
        `)
        .eq('workspace_id', filters.workspace_id)
        .order('generated_at', { ascending: false });

      if (filters.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }

      if (filters.report_type) {
        query = query.eq('report_type', filters.report_type);
      }

      if (filters.review_status) {
        query = query.eq('review_status', filters.review_status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (ImprovementReport & { agents: { name: string; avatar_url: string | null } })[];
    },
    enabled: !!filters.workspace_id,
  });
};
