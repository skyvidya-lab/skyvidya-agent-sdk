import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTestCase, useUpdateTestCase, TestCase } from '@/hooks/useTestCases';
import { useTenant } from '@/contexts/TenantContext';
import { useAgents } from '@/hooks/useAgents';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const testCaseSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  question: z.string().min(10, 'Pergunta deve ter no mínimo 10 caracteres'),
  expected_answer: z.string().min(10, 'Resposta esperada deve ter no mínimo 10 caracteres'),
  expected_score_min: z.number().min(0).max(100),
  tags: z.string(),
  agent_id: z.string().optional(),
});

type TestCaseFormData = z.infer<typeof testCaseSchema>;

interface TestCaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testCase?: TestCase | null;
}

export const TestCaseForm = ({ open, onOpenChange, testCase }: TestCaseFormProps) => {
  const { tenant: currentTenant } = useTenant();
  const { data: agents = [] } = useAgents(currentTenant?.id || '');
  const createCase = useCreateTestCase();
  const updateCase = useUpdateTestCase();

  const form = useForm<TestCaseFormData>({
    resolver: zodResolver(testCaseSchema),
    defaultValues: {
      category: testCase?.category || '',
      question: testCase?.question || '',
      expected_answer: testCase?.expected_answer || '',
      expected_score_min: testCase?.expected_score_min || 85,
      tags: testCase?.tags.join(', ') || '',
      agent_id: testCase?.agent_id || undefined,
    },
  });

  const onSubmit = async (data: TestCaseFormData) => {
    if (!currentTenant?.id) return;

    const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);

    const payload = {
      workspace_id: currentTenant.id,
      category: data.category,
      question: data.question,
      expected_answer: data.expected_answer,
      expected_score_min: data.expected_score_min,
      tags: tagsArray,
      agent_id: data.agent_id || null,
      is_active: true,
      created_by: null,
    };

    if (testCase) {
      await updateCase.mutateAsync({
        id: testCase.id,
        workspaceId: currentTenant.id,
        ...payload,
      });
    } else {
      await createCase.mutateAsync(payload);
    }

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {testCase ? 'Editar Caso de Teste' : 'Criar Caso de Teste'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Plano Diretor">Plano Diretor</SelectItem>
                      <SelectItem value="LGPD">LGPD</SelectItem>
                      <SelectItem value="Atendimento">Atendimento</SelectItem>
                      <SelectItem value="Técnico">Técnico</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agente (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os agentes" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todos os agentes</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pergunta</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Digite a pergunta do teste..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resposta Esperada</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Digite a resposta esperada..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_score_min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score Mínimo Esperado (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0} 
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (separadas por vírgula)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="prazo, atendimento, urgente"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCase.isPending || updateCase.isPending}>
                {testCase ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
