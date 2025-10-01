import { AppLayout } from "@/components/layout/AppLayout";
import { AgentList } from "@/components/agents/AgentList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
        <AgentList tenantId={profile.current_tenant_id} />
      ) : (
        <div className="flex items-center justify-center h-full p-6">
          <p className="text-muted-foreground">Selecione um tenant para visualizar os agentes</p>
        </div>
      )}
    </AppLayout>
  );
}
