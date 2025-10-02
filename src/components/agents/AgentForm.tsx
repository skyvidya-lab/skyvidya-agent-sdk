import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreateAgent, useUpdateAgent } from "@/hooks/useAgents";
import { useTestAgentConnection } from "@/hooks/useTestAgentConnection";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plug, Info } from "lucide-react";
import { useState, useEffect } from "react";

const agentSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  description: z.string().max(500).optional(),
  platform: z.enum(["dify", "langflow", "crewai", "native"]),
  platform_agent_id: z.string().optional(),
  api_endpoint: z.string().url("URL inválida").optional().or(z.literal("")),
  api_key_reference: z.string()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Use apenas MAIÚSCULAS, números e underscore (_)")
    .refine(
      (val) => !val || !val.match(/^(app-|sk-|[a-z0-9]{32,})/),
      "Este parece ser uma chave de API. Use o NOME da variável de ambiente"
    )
    .optional(),
  model_name: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  max_tokens: z.number().min(100).max(4000).optional(),
  system_prompt: z.string().optional(),
  knowledge_base: z.string().optional(),
  tenant_id: z.string().uuid(),
}).refine((data) => {
  const isExternal = ['dify', 'crewai', 'langflow'].includes(data.platform);
  
  if (isExternal) {
    return !!(data.platform_agent_id && data.api_endpoint && data.api_key_reference);
  }
  
  if (data.platform === 'native') {
    return !!(data.model_name && data.system_prompt);
  }
  
  return true;
}, {
  message: "Preencha todos os campos obrigatórios para a plataforma selecionada",
  path: ["platform"],
});

type AgentFormValues = z.infer<typeof agentSchema>;

interface AgentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: any;
  tenantId: string;
}

export function AgentForm({ open, onOpenChange, agent, tenantId }: AgentFormProps) {
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const testConnection = useTestAgentConnection();
  const [testResult, setTestResult] = useState<{ success: boolean; latency_ms: number } | null>(null);

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || "",
      description: agent?.description || "",
      platform: agent?.platform || "dify",
      platform_agent_id: agent?.platform_agent_id || "",
      api_endpoint: agent?.api_endpoint || "",
      api_key_reference: agent?.api_key_reference || "",
      model_name: agent?.model_name || "",
      temperature: agent?.temperature || 0.7,
      max_tokens: agent?.max_tokens || 2000,
      system_prompt: agent?.system_prompt || "",
      knowledge_base: agent?.knowledge_base || "",
      tenant_id: tenantId,
    },
  });

  const selectedPlatform = form.watch("platform");
  const isExternal = ['dify', 'crewai', 'langflow'].includes(selectedPlatform);
  
  // Watch fields for test button validation
  const platformAgentId = form.watch("platform_agent_id");
  const apiEndpoint = form.watch("api_endpoint");
  const apiKeyReference = form.watch("api_key_reference");
  
  const canTest = isExternal && !!(platformAgentId && apiEndpoint && apiKeyReference);

  // Reset form when agent changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: agent?.name || "",
        description: agent?.description || "",
        platform: agent?.platform || "dify",
        platform_agent_id: agent?.platform_agent_id || "",
        api_endpoint: agent?.api_endpoint || "",
        api_key_reference: agent?.api_key_reference || "",
        model_name: agent?.model_name || "",
        temperature: agent?.temperature || 0.7,
        max_tokens: agent?.max_tokens || 2000,
        system_prompt: agent?.system_prompt || "",
        knowledge_base: agent?.knowledge_base || "",
        tenant_id: tenantId,
      });
      setTestResult(null);
    }
  }, [agent, open, tenantId, form]);

  const handleTestConnection = () => {
    setTestResult(null);
    
    testConnection.mutate({
      platform: selectedPlatform,
      api_endpoint: apiEndpoint || "",
      api_key_reference: apiKeyReference || "",
      platform_agent_id: platformAgentId || "",
    }, {
      onSuccess: (data) => {
        setTestResult({ success: true, latency_ms: data.latency_ms });
      },
      onError: () => {
        setTestResult({ success: false, latency_ms: 0 });
      }
    });
  };

  const onSubmit = (data: AgentFormValues) => {
    if (agent) {
      updateAgent.mutate({ id: agent.id, ...data }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setTestResult(null);
        },
      });
    } else {
      createAgent.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setTestResult(null);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={agent?.id || 'new'}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? "Editar Agente" : "Criar Agente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do agente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do agente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="z-[200] bg-popover" sideOffset={5}>
                      <SelectItem value="dify">Dify</SelectItem>
                      <SelectItem value="langflow">Langflow</SelectItem>
                      <SelectItem value="crewai">CrewAI</SelectItem>
                      <SelectItem value="native">Native</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isExternal && (
              <>
                <div className="space-y-4 border-l-4 border-primary pl-4">
                  <h3 className="font-semibold text-sm">🔗 Configuração de API Externa</h3>
                  
                  <FormField
                    control={form.control}
                    name="platform_agent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Agente na Plataforma *</FormLabel>
                        <FormControl>
                          <Input placeholder="agent-id-123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="api_endpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Endpoint *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.dify.ai/v1" {...field} />
                        </FormControl>
                        <FormDescription>URL base da API da plataforma</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="api_key_reference"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Variável de Ambiente (Secret) *</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-popover text-popover-foreground border shadow-md z-[300]">
                                <div className="space-y-2 text-sm">
                                  <p className="font-semibold">💡 Como funciona:</p>
                                  <ol className="list-decimal list-inside space-y-1">
                                    <li>Configure a chave da API no Lovable Cloud</li>
                                    <li>Digite apenas o NOME da variável aqui</li>
                                    <li>O sistema busca o valor automaticamente</li>
                                  </ol>
                                  <p className="text-destructive font-semibold mt-2">
                                    ⚠️ NUNCA cole a chave da API real aqui!
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder={
                              selectedPlatform === 'dify' ? 'DIFY_API_KEY_[NOME_TENANT]' :
                              selectedPlatform === 'langflow' ? 'LANGFLOW_API_KEY_[NOME_TENANT]' :
                              selectedPlatform === 'crewai' ? 'CREWAI_API_KEY_[NOME_TENANT]' :
                              'NOME_DA_VARIAVEL_AMBIENTE'
                            }
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          <div className="flex flex-col gap-1">
                            <span>Nome da variável de ambiente onde a chave da API está armazenada</span>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs justify-start"
                              onClick={() => window.open('https://docs.lovable.dev/features/cloud#secrets-management', '_blank')}
                            >
                              Como configurar secrets no Lovable Cloud? →
                            </Button>
                          </div>
                        </FormDescription>
                        {field.value && (
                          <div className="mt-2 p-2 bg-muted rounded-md text-xs font-mono flex items-center gap-2">
                            <span className="text-muted-foreground">✓ Buscando secret:</span>
                            <span className="text-primary font-bold">{field.value}</span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testConnection.isPending || !canTest}
                    >
                      {testConnection.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>
                          <Plug className="w-4 h-4 mr-2" />
                          Testar Conexão
                        </>
                      )}
                    </Button>
                    
                    {testResult && (
                      <Badge variant={testResult.success ? "default" : "destructive"}>
                        {testResult.success ? `✓ Sucesso (${testResult.latency_ms}ms)` : '✗ Falha'}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {selectedPlatform === 'native' && (
              <FormField
                control={form.control}
                name="platform_agent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Agente</FormLabel>
                    <FormControl>
                      <Input placeholder="agent-id-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className={isExternal ? "space-y-4 bg-muted/30 p-4 rounded-lg" : "space-y-4 border-l-4 border-green-500 pl-4"}>
              {isExternal && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      📝 Configurações LLM
                    </h4>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Opcional - Metadados</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Campos opcionais para documentação. O processamento ocorre na plataforma externa.
                  </p>
                </div>
              )}
              
              {selectedPlatform === 'native' && (
                <h3 className="font-semibold text-sm">🤖 Configuração LLM</h3>
              )}
              
              <FormField
                control={form.control}
                name="model_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo {selectedPlatform === 'native' && '*'}</FormLabel>
                    <FormControl>
                      <Input placeholder="gpt-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature {selectedPlatform === 'native' && '*'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Valor entre 0 e 1</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens {selectedPlatform === 'native' && '*'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="100"
                        max="4000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="system_prompt"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>System Prompt {selectedPlatform === 'native' && '*'}</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs z-[300]">
                            <p className="text-sm">
                              Instruções fundamentais que definem o comportamento do agente.
                              <strong className="block mt-2">💡 Importante para análise de qualidade!</strong>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Você é um assistente útil..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="knowledge_base"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Base de Conhecimento</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs z-[300]">
                            <p className="text-sm">
                              Informações e contexto específico usado pelo agente.
                              <strong className="block mt-2">💡 Crucial para relatórios de melhoria automáticos!</strong>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Contexto e informações específicas que o agente deve conhecer..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Documentação, FAQs, políticas e outros dados que o agente deve ter acesso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAgent.isPending || updateAgent.isPending}>
                {agent ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
