import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SECURITY_TEST_CASES } from '@/data/securityTestCases';

export const useImportSecurityTests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      // Fetch existing security test cases for this workspace
      const { data: existingTests, error: fetchError } = await supabase
        .from('test_cases')
        .select('question')
        .eq('workspace_id', workspaceId)
        .eq('test_type', 'security');

      if (fetchError) throw fetchError;

      // Create a Set of existing questions for fast lookup
      const existingQuestions = new Set(
        existingTests?.map(test => test.question) || []
      );

      // Filter out test cases that already exist
      const newTestCases = SECURITY_TEST_CASES.filter(
        test => !existingQuestions.has(test.question)
      ).map(test => ({
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

      // If no new cases to import, return early
      if (newTestCases.length === 0) {
        return { 
          imported: 0, 
          total: SECURITY_TEST_CASES.length,
          skipped: existingQuestions.size
        };
      }

      // Insert in chunks to avoid timeout
      const chunkSize = 10;
      let inserted = 0;

      for (let i = 0; i < newTestCases.length; i += chunkSize) {
        const chunk = newTestCases.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('test_cases')
          .insert(chunk);

        if (error) throw error;
        inserted += chunk.length;
      }

      return { 
        imported: inserted, 
        total: SECURITY_TEST_CASES.length,
        skipped: existingQuestions.size
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['test-cases', variables.workspaceId] 
      });
      
      if (data.imported === 0 && data.skipped > 0) {
        toast.info(
          'Todos os casos de teste já existem neste workspace',
          { description: `${data.skipped} casos já importados anteriormente` }
        );
      } else if (data.imported > 0 && data.skipped > 0) {
        toast.success(
          `${data.imported} novos casos de teste importados!`,
          { description: `${data.skipped} casos já existiam` }
        );
      } else {
        toast.success(
          `${data.imported} casos de teste de segurança importados com sucesso!`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar casos de teste: ${error.message}`);
    },
  });
};
