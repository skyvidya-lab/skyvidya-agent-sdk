import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export function useAgents(tenantId?: string) {
  return useQuery({
    queryKey: ["agents", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Busca agentes do tenant específico (não busca globais aqui)
      // Para ver agentes disponíveis (globais + tenant), use useAllAvailableAgents
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (agent: any) => {
      const { data, error } = await supabase
        .from("agents")
        .insert({ ...agent, created_by: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agente criado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar agente");
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...agent }: any) => {
      const { data, error } = await supabase
        .from("agents")
        .update(agent)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agente atualizado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar agente");
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agente deletado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar agente");
    },
  });
}
