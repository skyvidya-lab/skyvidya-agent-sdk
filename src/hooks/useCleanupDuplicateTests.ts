import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCleanupDuplicateTests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      // Fetch all security test cases for this workspace
      const { data: allTests, error: fetchError } = await supabase
        .from('test_cases')
        .select('id, question, created_at')
        .eq('workspace_id', workspaceId)
        .eq('test_type', 'security')
        .order('question', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (!allTests || allTests.length === 0) {
        return { deleted: 0, kept: 0 };
      }

      // Group tests by question
      const testsByQuestion = new Map<string, typeof allTests>();
      allTests.forEach(test => {
        const existing = testsByQuestion.get(test.question) || [];
        existing.push(test);
        testsByQuestion.set(test.question, existing);
      });

      // Find duplicates to delete (keep only the oldest one)
      const duplicateIds: string[] = [];
      testsByQuestion.forEach((tests) => {
        if (tests.length > 1) {
          // Keep the first (oldest) test, delete the rest
          const toDelete = tests.slice(1).map(t => t.id);
          duplicateIds.push(...toDelete);
        }
      });

      if (duplicateIds.length === 0) {
        return { deleted: 0, kept: allTests.length };
      }

      // Delete duplicates
      const { error: deleteError } = await supabase
        .from('test_cases')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) throw deleteError;

      return { 
        deleted: duplicateIds.length, 
        kept: allTests.length - duplicateIds.length 
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['test-cases', variables.workspaceId] 
      });
      
      if (data.deleted === 0) {
        toast.info('Nenhum caso de teste duplicado encontrado');
      } else {
        toast.success(
          `${data.deleted} casos de teste duplicados removidos`,
          { description: `${data.kept} casos únicos mantidos` }
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao limpar duplicatas: ${error.message}`);
    },
  });
};

