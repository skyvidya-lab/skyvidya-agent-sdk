import { useState } from "react";
import { useAgents, useDeleteAgent } from "@/hooks/useAgents";
import { useTestAgentConnection } from "@/hooks/useTestAgentConnection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Activity, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AgentForm } from "./AgentForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agentes</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Agente
        </Button>
      </div>

      {!agents || agents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum agente encontrado. Crie seu primeiro agente!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{agent.platform}</Badge>
                    <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                      {agent.status}
                    </Badge>
                    {getStatusBadge(agent.id)}
                  </div>
                  {agent.model_name && (
                    <p className="text-sm text-muted-foreground">
                      Modelo: {agent.model_name}
                    </p>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
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
              </CardContent>
            </Card>
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
