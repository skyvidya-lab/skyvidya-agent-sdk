import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useActiveBatches = (workspaceId: string) => {
  const query = useQuery({
    queryKey: ['active-batches', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
    refetchInterval: 2000, // Refetch every 2 seconds to catch active batches
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel('batch-executions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_executions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, query]);

  return query;
};
