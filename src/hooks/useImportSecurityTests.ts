import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SECURITY_TEST_CASES } from '@/data/securityTestCases';

export const useImportSecurityTests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const testCases = SECURITY_TEST_CASES.map(test => ({
        workspace_id: workspaceId,
        category: test.category,
        question: test.question,
        expected_answer: test.expected_answer,
        expected_score_min: test.expected_score_min,
        test_type: test.test_type,
        severity: test.severity,
        attack_category: test.attack_category,
        tags: test.tags,
        detection_patterns: test.detection_patterns,
        difficulty: test.difficulty,
        is_active: true,
      }));

      // Insert in chunks to avoid timeout
      const chunkSize = 10;
      let inserted = 0;

      for (let i = 0; i < testCases.length; i += chunkSize) {
        const chunk = testCases.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('test_cases')
          .insert(chunk);

        if (error) throw error;
        inserted += chunk.length;
      }

      return { imported: inserted, total: testCases.length };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['test-cases', variables.workspaceId] 
      });
      toast.success(
        `${data.imported} casos de teste de segurança importados com sucesso!`
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar casos de teste: ${error.message}`);
    },
  });
};
