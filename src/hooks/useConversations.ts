import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useConversations(agentId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", agentId],
    queryFn: async () => {
      let query = supabase
        .from("conversations")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const createConversation = useMutation({
    mutationFn: async ({ agentId, title, isPlayground }: { 
      agentId: string; 
      title?: string;
      isPlayground?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let tenantId: string | null = null;

      if (!isPlayground) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_tenant_id")
          .eq("id", user.id)
          .single();

        if (!profile?.current_tenant_id) throw new Error("No tenant selected");
        tenantId = profile.current_tenant_id;
      } else {
        // Playground: buscar o tenant_id do agente selecionado
        const { data: agent } = await supabase
          .from("agents")
          .select("tenant_id")
          .eq("id", agentId)
          .single();
        
        tenantId = agent?.tenant_id || null;
      }

      if (!tenantId) throw new Error("Could not determine tenant for conversation");

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          agent_id: agentId,
          user_id: user.id,
          tenant_id: tenantId,
          title: title || "Nova Conversa",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conversa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    conversations,
    isLoading,
    createConversation: createConversation.mutateAsync,
  };
}
