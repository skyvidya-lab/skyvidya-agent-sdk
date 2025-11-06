import { AppLayout } from "@/components/layout/AppLayout";
import { AgentList } from "@/components/agents/AgentList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bot } from "lucide-react";

export default function Agents() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("current_tenant_id")
        .eq("id", user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <AppLayout>
      {profile?.current_tenant_id ? (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Agentes</h1>
            <p className="text-muted-foreground">
              Crie e configure agentes de IA
            </p>
          </div>
          
          <AgentList tenantId={profile.current_tenant_id} />
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
