import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useImportSecurityTests } from './useImportSecurityTests';
import { toast } from 'sonner';

export const useAutoImportSecurityTests = (workspaceId: string) => {
  const [hasChecked, setHasChecked] = useState(false);
  const queryClient = useQueryClient();
  const importMutation = useImportSecurityTests();

  useEffect(() => {
    const checkAndImport = async () => {
      if (!workspaceId || hasChecked) return;

      try {
        // Check if workspace has any security test cases
        const { data, error } = await supabase
          .from('test_cases')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('test_type', 'security');

        if (error) throw error;

        const count = data?.length || 0;

        // If no security tests exist, auto-import predefined ones
        if (count === 0) {
          await importMutation.mutateAsync({ workspaceId });
          
          toast.success('✨ 20 casos de teste de segurança adicionados automaticamente', {
            description: 'Casos predefinidos prontos para execução'
          });

          queryClient.invalidateQueries({ queryKey: ['test-cases', workspaceId] });
        }
      } catch (error) {
        console.error('Error checking security tests:', error);
      } finally {
        setHasChecked(true);
      }
    };

    checkAndImport();
  }, [workspaceId, hasChecked, importMutation, queryClient]);

  return { hasChecked };
};
