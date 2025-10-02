import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TestExecution {
  id: string;
  test_case_id: string;
  agent_id: string;
  workspace_id: string;
  question_asked: string;
  expected_answer: string;
  actual_answer: string | null;
  similarity_score: number | null;
  factual_accuracy: number | null;
  relevance_score: number | null;
  tokens_used: number | null;
  latency_ms: number | null;
  cost_usd: number | null;
  validation_justification: string | null;
  cognitive_gaps: any[];
  improvement_suggestions: any[];
  status: 'pending' | 'passed' | 'failed' | 'warning';
  executed_at: string;
  executed_by: string | null;
}

export interface TestExecutionFilters {
  agentId?: string;
  testCaseId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useTestExecutions = (workspaceId: string, filters?: TestExecutionFilters) => {
  return useQuery({
    queryKey: ['test-executions', workspaceId, filters],
    queryFn: async () => {
      let query = supabase
        .from('test_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('executed_at', { ascending: false });

      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }

      if (filters?.testCaseId) {
        query = query.eq('test_case_id', filters.testCaseId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('executed_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('executed_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TestExecution[];
    },
    enabled: !!workspaceId,
  });
};

export const useExecutionDetail = (executionId: string) => {
  return useQuery({
    queryKey: ['test-execution', executionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_executions')
        .select(`
          *,
          test_cases:test_case_id(*),
          agents:agent_id(*)
        `)
        .eq('id', executionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!executionId,
  });
};

export const useExecuteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testCaseId,
      agentId,
      workspaceId,
    }: {
      testCaseId: string;
      agentId: string;
      workspaceId: string;
    }) => {
      // Get test case details
      const { data: testCase, error: testCaseError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', testCaseId)
        .single();

      if (testCaseError) throw testCaseError;

      // Create execution record
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: execution, error: executionError } = await supabase
        .from('test_executions')
        .insert({
          test_case_id: testCaseId,
          agent_id: agentId,
          workspace_id: workspaceId,
          question_asked: testCase.question,
          expected_answer: testCase.expected_answer,
          status: 'pending',
          executed_by: user?.id,
        })
        .select()
        .single();

      if (executionError) throw executionError;

      // Call agent to get response
      const startTime = Date.now();
      const { data: agentResponse, error: agentError } = await supabase.functions.invoke('call-agent', {
        body: {
          agent_id: agentId,
          message: testCase.question,
        },
      });

      const latency = Date.now() - startTime;

      if (agentError) {
        // Update execution with error
        await supabase
          .from('test_executions')
          .update({
            status: 'failed',
            latency_ms: latency,
            actual_answer: agentError.message,
          })
          .eq('id', execution.id);
        
        throw agentError;
      }

      // Extract actual answer from agent response
      const actualAnswer = agentResponse.message || agentResponse.response || 'No response';
      
      // Update execution with actual answer and latency
      await supabase
        .from('test_executions')
        .update({
          actual_answer: actualAnswer,
          latency_ms: latency,
        })
        .eq('id', execution.id);

      // Call validation function
      const { data: validation, error: validationError } = await supabase.functions.invoke('validate-agent-response', {
        body: {
          execution_id: execution.id,
          question: testCase.question,
          expected_answer: testCase.expected_answer,
          actual_answer: actualAnswer,
        },
      });

      // Check if validation failed
      if (validationError) {
        console.error('Validation error:', validationError);
        
        // Update execution status to failed
        await supabase
          .from('test_executions')
          .update({
            status: 'failed',
          })
          .eq('id', execution.id);
        
        throw new Error(`Falha na validação: ${validationError.message}`);
      }

      if (validation?.error) {
        console.error('Validation returned error:', validation.error);
        
        // Update execution status to failed
        await supabase
          .from('test_executions')
          .update({
            status: 'failed',
          })
          .eq('id', execution.id);
        
        throw new Error(`Erro na análise: ${validation.error}`);
      }

      return { execution, validation };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-executions', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['execution-metrics', variables.workspaceId] });
      toast.success('Teste executado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao executar teste: ${error.message}`);
    },
  });
};

export const useExecutionMetrics = (workspaceId: string, agentId?: string) => {
  return useQuery({
    queryKey: ['execution-metrics', workspaceId, agentId],
    queryFn: async () => {
      let query = supabase
        .from('test_executions')
        .select('similarity_score, factual_accuracy, relevance_score, latency_ms, cost_usd, tokens_used, status')
        .eq('workspace_id', workspaceId)
        .not('similarity_score', 'is', null);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate metrics with safe division
      const total = data.length;
      
      if (total === 0) {
        return {
          total: 0,
          avgAccuracy: 0,
          avgSpeed: 0,
          totalCost: 0,
          totalTokens: 0,
          successRate: 0,
        };
      }

      const avgAccuracy = data.reduce((sum, e) => sum + (e.similarity_score || 0), 0) / total;
      const avgSpeed = data.reduce((sum, e) => sum + (e.latency_ms || 0), 0) / total;
      const totalCost = data.reduce((sum, e) => sum + (e.cost_usd || 0), 0);
      const totalTokens = data.reduce((sum, e) => sum + (e.tokens_used || 0), 0);
      const successRate = (data.filter(e => e.status === 'passed').length / total) * 100;

      return {
        total,
        avgAccuracy,
        avgSpeed,
        totalCost,
        totalTokens,
        successRate,
      };
    },
    enabled: !!workspaceId,
  });
};
