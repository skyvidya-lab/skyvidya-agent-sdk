import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityTestExecution {
  id: string;
  workspace_id: string;
  agent_id: string;
  test_case_id: string;
  executed_at: string;
  executed_by: string | null;
  question_asked: string;
  actual_response: string;
  security_status: 'passed' | 'failed' | 'warning';
  vulnerability_detected: boolean;
  attack_patterns_matched: string[];
  risk_level: 'critical' | 'high' | 'medium' | 'low' | null;
  detection_details: Record<string, any>;
  false_positive: boolean;
  human_reviewed: boolean;
  human_review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  tokens_used: number | null;
  latency_ms: number | null;
  metadata: Record<string, any>;
}

export const useSecurityTestExecutions = (workspaceId: string) => {
  return useQuery({
    queryKey: ['security-test-executions', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_test_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('executed_at', { ascending: false });

      if (error) throw error;
      return data as SecurityTestExecution[];
    },
    enabled: !!workspaceId,
  });
};
