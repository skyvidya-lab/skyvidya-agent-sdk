import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTenantDomains(tenantId?: string) {
  return useQuery({
    queryKey: ["tenant-domains", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("tenant_domains")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}

export function useAddDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, domain }: { tenantId: string; domain: string }) => {
      const { data, error } = await supabase
        .from("tenant_domains")
        .insert({ tenant_id: tenantId, domain })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domains", data.tenant_id] });
      toast.success("Domínio adicionado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar domínio");
    },
  });
}

export function useVerifyDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainId: string) => {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { domainId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, domainId) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domains"] });
      toast.success("Domínio verificado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao verificar domínio");
    },
  });
}

export function useSetPrimaryDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ domainId, tenantId }: { domainId: string; tenantId: string }) => {
      // Primeiro, remove o flag primary de todos os domínios do tenant
      await supabase
        .from("tenant_domains")
        .update({ is_primary: false })
        .eq("tenant_id", tenantId);

      // Depois, define o novo domínio como primário
      const { data, error } = await supabase
        .from("tenant_domains")
        .update({ is_primary: true })
        .eq("id", domainId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domains", data.tenant_id] });
      toast.success("Domínio primário atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar domínio primário");
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ domainId, tenantId }: { domainId: string; tenantId: string }) => {
      const { error } = await supabase
        .from("tenant_domains")
        .delete()
        .eq("id", domainId);

      if (error) throw error;
      return { tenantId };
    },
    onSuccess: ({ tenantId }) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domains", tenantId] });
      toast.success("Domínio removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover domínio");
    },
  });
}
