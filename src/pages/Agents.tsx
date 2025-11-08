import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AgentList } from "@/components/agents/AgentList";
import { WorkspaceSelector } from "@/components/workspace/WorkspaceSelector";
import { Bot } from "lucide-react";

export default function Agents() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    () => localStorage.getItem('admin-selected-workspace')
  );

  useEffect(() => {
    if (selectedWorkspaceId) {
      localStorage.setItem('admin-selected-workspace', selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Agentes de IA</h1>
              <p className="text-sm text-muted-foreground">Gerencie os agentes do workspace</p>
            </div>
            <WorkspaceSelector 
              value={selectedWorkspaceId} 
              onChange={setSelectedWorkspaceId}
              placeholder="Selecione um workspace"
            />
          </div>
        </div>

        {selectedWorkspaceId ? (
          <div className="flex-1 overflow-y-auto">
            <AgentList tenantId={selectedWorkspaceId} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="rounded-full bg-primary/10 p-6 inline-block mb-4">
                <Bot className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Selecione um Workspace</h3>
              <p className="text-muted-foreground max-w-md">
                Escolha um workspace acima para visualizar e gerenciar seus agentes
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
