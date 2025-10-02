import { useState } from "react";
import { useAgents, useDeleteAgent } from "@/hooks/useAgents";
import { useTestAgentConnection } from "@/hooks/useTestAgentConnection";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Activity, CheckCircle2, XCircle, Loader2, Bot } from "lucide-react";
import { AgentForm } from "./AgentForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AgentListProps {
  tenantId: string;
}

export function AgentList({ tenantId }: AgentListProps) {
  const { data: agents, isLoading } = useAgents(tenantId);
  const deleteAgent = useDeleteAgent();
  const testConnection = useTestAgentConnection();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number; timestamp: Date }>>({});

  const handleEdit = (agent: any) => {
    setSelectedAgent(agent);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedAgent(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (agentId: string) => {
    setAgentToDelete(agentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (agentToDelete) {
      deleteAgent.mutate(agentToDelete);
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    }
  };

  const handleTestConnection = async (agent: any) => {
    setTestingAgentId(agent.id);
    try {
      const result = await testConnection.mutateAsync({
        platform: agent.platform,
        api_endpoint: agent.api_endpoint,
        api_key_reference: agent.api_key_reference,
        platform_agent_id: agent.platform_agent_id,
      });
      setTestResults(prev => ({
        ...prev,
        [agent.id]: {
          success: result.success,
          latency: result.latency_ms,
          timestamp: new Date(),
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [agent.id]: {
          success: false,
          timestamp: new Date(),
        }
      }));
    } finally {
      setTestingAgentId(null);
    }
  };

  const getStatusBadge = (agentId: string) => {
    const result = testResults[agentId];
    if (!result) return null;

    const isRecent = Date.now() - result.timestamp.getTime() < 5 * 60 * 1000; // 5 minutos
    if (!isRecent) return null;

    if (result.success) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Online {result.latency && `(${result.latency}ms)`}
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Offline
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Agentes de IA
            </h1>
            <p className="text-muted-foreground mt-2">Configure e gerencie seus assistentes inteligentes</p>
          </div>
        </div>
        <LoadingState type="card" count={6} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Agentes de IA
          </h1>
          <p className="text-muted-foreground mt-2">Configure e gerencie seus assistentes inteligentes</p>
        </div>
        <Button onClick={handleCreate} size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="h-5 w-5 mr-2" />
          Criar Agente
        </Button>
      </div>

      {!agents || agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Nenhum agente criado"
          description="Crie seu primeiro agente de IA para começar a automatizar interações e fornecer assistência inteligente aos seus usuários."
          action={{
            label: "Criar Primeiro Agente",
            onClick: handleCreate
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {agents.map((agent, index) => (
            <GlassCard key={agent.id} className="group relative overflow-hidden" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <GlassCardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <GlassCardTitle className="text-lg">{agent.name}</GlassCardTitle>
                    </div>
                    <GlassCardDescription className="line-clamp-2">
                      {agent.description}
                    </GlassCardDescription>
                  </div>
                  <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity relative z-10">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)} className="h-8 w-8">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(agent.id)}
                      className="h-8 w-8 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{agent.platform}</Badge>
                    <Badge variant={agent.status === "active" ? "default" : "secondary"} className="text-xs">
                      {agent.status}
                    </Badge>
                    {getStatusBadge(agent.id)}
                  </div>
                  {agent.model_name && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Modelo:</span> {agent.model_name}
                    </p>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 hover:bg-primary/10 transition-colors"
                          onClick={() => handleTestConnection(agent)}
                          disabled={testingAgentId === agent.id}
                        >
                          {testingAgentId === agent.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Testando...
                            </>
                          ) : (
                            <>
                              <Activity className="h-4 w-4 mr-2" />
                              Testar Conexão
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Validar conectividade com a plataforma externa</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}

      <AgentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        agent={selectedAgent}
        tenantId={tenantId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este agente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
