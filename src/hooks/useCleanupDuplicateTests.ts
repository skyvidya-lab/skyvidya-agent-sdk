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

      // Delete duplicates in batches to avoid URL length limits
      const BATCH_SIZE = 50;
      let deletedCount = 0;
      const totalBatches = Math.ceil(duplicateIds.length / BATCH_SIZE);

      for (let i = 0; i < duplicateIds.length; i += BATCH_SIZE) {
        const batch = duplicateIds.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
        
        // Show progress
        toast.info(
          `Limpando duplicatas... (${Math.min(i + BATCH_SIZE, duplicateIds.length)}/${duplicateIds.length})`,
          { 
            description: `Lote ${currentBatch} de ${totalBatches}`,
            duration: 1000 
          }
        );

        try {
          const { error: deleteError } = await supabase
            .from('test_cases')
            .delete()
            .in('id', batch);

          if (deleteError) {
            console.error(`Erro ao deletar lote ${currentBatch}:`, deleteError);
            throw deleteError;
          }

          deletedCount += batch.length;
        } catch (error) {
          // If one batch fails, throw error to stop the process
          throw new Error(`Falha ao deletar lote ${currentBatch} de ${totalBatches}: ${error}`);
        }
      }

      return { 
        deleted: deletedCount, 
        kept: allTests.length - deletedCount 
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

