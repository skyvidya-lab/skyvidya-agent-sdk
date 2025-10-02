import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BatchProgress {
  id: string;
  workspace_id: string;
  agent_ids: string[];
  test_case_ids: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_tests: number;
  completed_tests: number;
  successful_tests: number;
  failed_tests: number;
  started_at: string | null;
  completed_at: string | null;
  estimated_completion: string | null;
  execution_ids: string[];
  error_log: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
  created_at: string;
}

export const useBatchExecutionProgress = (batchId: string | null) => {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!batchId) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    // Fetch initial state
    const fetchInitialState = async () => {
      const { data, error } = await supabase
        .from('batch_executions')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) {
        console.error('Error fetching batch execution:', error);
        setIsLoading(false);
        return;
      }

      setProgress({
        ...data,
        error_log: Array.isArray(data.error_log) ? data.error_log : []
      } as unknown as BatchProgress);
      setIsLoading(false);
    };

    fetchInitialState();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`batch-execution-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_executions',
          filter: `id=eq.${batchId}`
        },
        (payload) => {
          console.log('Batch execution update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setProgress({
              ...payload.new,
              error_log: Array.isArray(payload.new.error_log) ? payload.new.error_log : []
            } as unknown as BatchProgress);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId]);

  const percentComplete = progress 
    ? Math.round((progress.completed_tests / progress.total_tests) * 100)
    : 0;

  const successRate = progress && progress.completed_tests > 0
    ? Math.round((progress.successful_tests / progress.completed_tests) * 100)
    : 0;

  const canClose = progress?.status === 'completed' || progress?.status === 'failed' || progress?.status === 'cancelled';

  return {
    progress,
    isLoading,
    percentComplete,
    successRate,
    canClose
  };
};
