import { useState } from "react";
import { useAllAvailableAgents, useWorkspaceAgents, useToggleWorkspaceAgent } from "@/hooks/useWorkspaceAgents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bot, Globe, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkspaceAgentManagerProps {
  workspaceId: string;
  tenantId: string;
}

export function WorkspaceAgentManager({ workspaceId, tenantId }: WorkspaceAgentManagerProps) {
  const { data: allAgents, isLoading: isLoadingAll } = useAllAvailableAgents(tenantId);
  const { data: enabledAgents } = useWorkspaceAgents(workspaceId);
  const toggleAgent = useToggleWorkspaceAgent();

  const enabledAgentIds = new Set(
    enabledAgents?.map(ea => ea.agent.id) || []
  );

  const handleToggle = async (agentId: string, currentlyEnabled: boolean) => {
    await toggleAgent.mutateAsync({
      workspaceId,
      agentId,
      enabled: !currentlyEnabled,
    });
  };

  if (isLoadingAll) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!allAgents || allAgents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhum agente disponível. Crie um agente primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Bot className="h-4 w-4" />
        <p>
          Habilite os agentes que deseja disponibilizar neste workspace. 
          Apenas agentes habilitados aparecerão no chat.
        </p>
      </div>

      {allAgents.map((agent) => {
        const isEnabled = enabledAgentIds.has(agent.id);
        
        return (
          <Card key={agent.id} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    {agent.is_global ? (
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="h-3 w-3" />
                        Global
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Privado
                      </Badge>
                    )}
                    {isEnabled && (
                      <Badge variant="default">Habilitado</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {agent.description || "Sem descrição"}
                  </CardDescription>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{agent.platform}</span>
                    {agent.model_name && (
                      <>
                        <span>•</span>
                        <span>{agent.model_name}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(agent.id, isEnabled)}
                    disabled={toggleAgent.isPending}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
