import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExecuteBatchParams {
  workspace_id: string;
  agent_ids: string[];
  test_case_ids: string[];
  interval_ms?: number;
}

interface BatchProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  warnings: number;
  currentAgent?: string;
  currentTest?: string;
}

export const useSecurityBatchExecution = () => {
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    successful: 0,
    failed: 0,
    warnings: 0,
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const queryClient = useQueryClient();

  const executeBatch = async ({ 
    workspace_id, 
    agent_ids, 
    test_case_ids,
    interval_ms = 1000 
  }: ExecuteBatchParams) => {
    setIsExecuting(true);
    const total = agent_ids.length * test_case_ids.length;
    let completed = 0;
    let successful = 0;
    let failed = 0;
    let warnings = 0;

    setProgress({ total, completed, successful, failed, warnings });

    // Get test cases details
    const { data: testCases } = await supabase
      .from('test_cases')
      .select('*')
      .in('id', test_case_ids);

    if (!testCases) throw new Error('Test cases not found');

    // Get agents details
    const { data: agents } = await supabase
      .from('agents')
      .select('*')
      .in('id', agent_ids);

    if (!agents) throw new Error('Agents not found');

    // Execute tests sequentially
    for (const agent of agents) {
      for (const testCase of testCases) {
        try {
          setProgress(prev => ({ 
            ...prev, 
            currentAgent: agent.name,
            currentTest: testCase.question.substring(0, 50) + '...'
          }));

          const { data, error } = await supabase.functions.invoke('execute-security-test', {
            body: {
              workspace_id,
              agent_id: agent.id,
              test_case_id: testCase.id,
              question: testCase.question,
              detection_patterns: testCase.detection_patterns || [],
              severity: testCase.severity || 'medium',
              attack_category: testCase.attack_category || 'unknown'
            }
          });

          if (error) throw error;

          completed++;
          
          if (data.security_status === 'passed') {
            successful++;
          } else if (data.security_status === 'warning') {
            warnings++;
          } else {
            failed++;
          }

          setProgress({ total, completed, successful, failed, warnings });

          // Wait between tests to avoid rate limiting
          if (completed < total) {
            await new Promise(resolve => setTimeout(resolve, interval_ms));
          }
        } catch (error) {
          console.error('Error executing test:', error);
          completed++;
          failed++;
          setProgress({ total, completed, successful, failed, warnings });
        }
      }
    }

    setIsExecuting(false);
    return { total, completed, successful, failed, warnings };
  };

  const mutation = useMutation({
    mutationFn: executeBatch,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['security-test-executions'] });
      queryClient.invalidateQueries({ queryKey: ['security-compliance-reports'] });
      
      toast.success('Batch de testes concluído', {
        description: `${result.successful} passaram, ${result.failed} falharam, ${result.warnings} avisos`
      });
    },
    onError: (error: Error) => {
      toast.error(`Erro na execução: ${error.message}`);
      setIsExecuting(false);
    },
  });

  return {
    ...mutation,
    progress,
    isExecuting,
  };
};
