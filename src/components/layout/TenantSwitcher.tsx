import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function TenantSwitcher() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: tenants } = useQuery({
    queryKey: ["user-tenants", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("tenant_id, tenants(id, name)")
        .eq("user_id", user?.id);
      
      if (error) throw error;
      return data.map(ur => ur.tenants).filter(Boolean);
    },
    enabled: !!user?.id,
  });

  const switchTenant = useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ current_tenant_id: tenantId })
        .eq("id", user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Tenant alterado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao alterar tenant");
    },
  });

  return (
    <Select
      value={profile?.current_tenant_id || ""}
      onValueChange={(value) => switchTenant.mutate(value)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione um tenant" />
      </SelectTrigger>
      <SelectContent>
        {tenants?.map((tenant: any) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
