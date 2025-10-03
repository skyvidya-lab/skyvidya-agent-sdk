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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function TenantSwitcher() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useQuery({
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
    retry: 1,
  });

  const { data: tenants, isLoading: isLoadingTenants, error: tenantsError } = useQuery({
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
    retry: 1,
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
    onError: (error: any) => {
      if (error?.message?.includes("JWT")) {
        toast.error("Sessão expirada. Faça login novamente.");
      } else {
        toast.error("Erro ao alterar tenant");
      }
    },
  });

  // Check for JWT expiration errors
  const hasJWTError = 
    profileError?.message?.includes("JWT") || 
    tenantsError?.message?.includes("JWT");

  if (hasJWTError) {
    return (
      <Alert variant="destructive" className="mb-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <span className="text-xs">Sessão expirada</span>
          <Button size="sm" variant="outline" onClick={signOut}>
            Fazer login novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoadingProfile || isLoadingTenants) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!tenants || tenants.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Nenhum workspace disponível
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Select
      value={profile?.current_tenant_id || ""}
      onValueChange={(value) => switchTenant.mutate(value)}
    >
      <SelectTrigger className="w-full relative z-50">
        <SelectValue placeholder="Selecione um workspace" />
      </SelectTrigger>
      <SelectContent 
        className="z-[100] bg-popover"
        sideOffset={5}
      >
        {tenants?.map((tenant: any) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
