import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useWorkspaceAgents(workspaceId?: string) {
  return useQuery({
    queryKey: ["workspace-agents", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_agents")
        .select(`
          id,
          enabled,
          custom_config,
          agent:agents (
            id,
            name,
            description,
            platform,
            status,
            model_name,
            avatar_url,
            system_prompt,
            temperature,
            max_tokens,
            is_global
          )
        `)
        .eq("workspace_id", workspaceId)
        .eq("enabled", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useAllAvailableAgents(tenantId?: string) {
  return useQuery({
    queryKey: ["agents", "available", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("agents")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      if (tenantId) {
        // Workspace específico: buscar globais + do tenant
        query = query.or(`is_global.eq.true,tenant_id.eq.${tenantId}`);
      }
      // Se não há tenantId (Playground): buscar TODOS os agentes ativos
      // (sem filtro adicional de is_global ou tenant_id)
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Transform to match workspace_agents structure
      return data?.map(agent => ({
        id: `all-${agent.id}`,
        enabled: true,
        custom_config: null,
        agent: agent
      })) || [];
    },
    enabled: true, // Sempre habilita a query, mesmo sem tenantId (Playground)
  });
}

export function useToggleWorkspaceAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      workspaceId, 
      agentId, 
      enabled 
    }: {
      workspaceId: string;
      agentId: string;
      enabled: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("workspace_agents")
        .upsert({
          workspace_id: workspaceId,
          agent_id: agentId,
          enabled,
          enabled_by: user?.id,
          enabled_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id,agent_id'
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["workspace-agents", variables.workspaceId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["agents"] 
      });
      toast.success(
        variables.enabled 
          ? "Agente habilitado no workspace" 
          : "Agente desabilitado no workspace"
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar agente");
    },
  });
}
