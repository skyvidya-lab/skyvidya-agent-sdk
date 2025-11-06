import { AppLayout } from "@/components/layout/AppLayout";
import { AgentList } from "@/components/agents/AgentList";
import { WorkspaceAgentManager } from "@/components/agents/WorkspaceAgentManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bot, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Agents() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("current_tenant_id")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <AppLayout>
      {profile?.current_tenant_id ? (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <Tabs defaultValue="my-agents" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="my-agents" className="gap-2">
                <Bot className="h-4 w-4" />
                Meus Agentes
              </TabsTrigger>
              <TabsTrigger value="workspace-agents" className="gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar Habilitação
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-agents" className="mt-6">
              <AgentList tenantId={profile.current_tenant_id} />
            </TabsContent>
            
            <TabsContent value="workspace-agents" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Agentes Disponíveis</h2>
                  <p className="text-muted-foreground">
                    Habilite ou desabilite agentes para este workspace. Apenas agentes habilitados aparecerão no chat.
                  </p>
                </div>
                <WorkspaceAgentManager 
                  workspaceId={profile.current_tenant_id} 
                  tenantId={profile.current_tenant_id}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="rounded-full bg-primary/10 p-6 inline-block mb-4">
              <Bot className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Nenhum Workspace Selecionado</h3>
            <p className="text-muted-foreground max-w-md">
              Selecione um workspace no menu lateral para visualizar e gerenciar seus agentes
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
