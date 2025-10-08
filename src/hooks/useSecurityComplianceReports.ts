import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityComplianceReport {
  id: string;
  workspace_id: string;
  agent_id: string;
  generated_at: string;
  generated_by: string | null;
  analysis_period_start: string;
  analysis_period_end: string;
  total_tests: number;
  tests_passed: number;
  tests_failed: number;
  tests_warning: number;
  compliance_score: number | null;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  category_analysis: Record<string, any>;
  executive_summary: string | null;
  vulnerabilities_found: any[];
  recommendations: any[];
  lessons_learned: any[];
  full_report: Record<string, any>;
  report_status: 'generated' | 'reviewed' | 'archived';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  exported_pdf_url: string | null;
  exported_at: string | null;
}

export const useSecurityComplianceReports = (workspaceId: string) => {
  return useQuery({
    queryKey: ['security-compliance-reports', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_compliance_reports')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data as SecurityComplianceReport[];
    },
    enabled: !!workspaceId,
  });
};
