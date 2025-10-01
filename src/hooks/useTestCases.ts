import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TestCase {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  category: string;
  question: string;
  expected_answer: string;
  expected_score_min: number;
  tags: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestCaseFilters {
  category?: string;
  agentId?: string;
  isActive?: boolean;
  tags?: string[];
  search?: string;
}

export const useTestCases = (workspaceId: string, filters?: TestCaseFilters) => {
  return useQuery({
    queryKey: ['test-cases', workspaceId, filters],
    queryFn: async () => {
      let query = supabase
        .from('test_cases')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.search) {
        query = query.or(`question.ilike.%${filters.search}%,expected_answer.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TestCase[];
    },
    enabled: !!workspaceId,
  });
};

export const useCreateTestCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('test_cases')
        .insert({
          ...testCase,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', variables.workspace_id] });
      toast.success('Caso de teste criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar caso de teste: ${error.message}`);
    },
  });
};

export const useUpdateTestCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId, ...updates }: Partial<TestCase> & { id: string; workspaceId: string }) => {
      const { data, error } = await supabase
        .from('test_cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', variables.workspaceId] });
      toast.success('Caso de teste atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar caso de teste: ${error.message}`);
    },
  });
};

export const useDeleteTestCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', variables.workspaceId] });
      toast.success('Caso de teste removido com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover caso de teste: ${error.message}`);
    },
  });
};

export const useBulkImportTestCases = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      workspaceId, 
      testCases 
    }: { 
      workspaceId: string; 
      testCases: Omit<TestCase, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert in chunks of 50
      const chunkSize = 50;
      const results = [];
      
      for (let i = 0; i < testCases.length; i += chunkSize) {
        const chunk = testCases.slice(i, i + chunkSize).map(tc => ({
          ...tc,
          created_by: user?.id,
        }));
        
        const { data, error } = await supabase
          .from('test_cases')
          .insert(chunk)
          .select();

        if (error) throw error;
        results.push(...(data || []));
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', variables.workspaceId] });
      toast.success(`${_.length} casos de teste importados com sucesso`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar casos de teste: ${error.message}`);
    },
  });
};

export const useExportTestCases = () => {
  return useMutation({
    mutationFn: async (testCases: TestCase[]) => {
      // Convert to CSV
      const headers = ['category', 'question', 'expected_answer', 'expected_score_min', 'tags'];
      const csv = [
        headers.join(','),
        ...testCases.map(tc => [
          `"${tc.category}"`,
          `"${tc.question.replace(/"/g, '""')}"`,
          `"${tc.expected_answer.replace(/"/g, '""')}"`,
          tc.expected_score_min,
          `"${tc.tags.join(',')}"`,
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-cases-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return testCases.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} casos de teste exportados com sucesso`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao exportar casos de teste: ${error.message}`);
    },
  });
};
