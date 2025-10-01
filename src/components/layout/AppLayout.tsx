import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/hooks/useTenantBranding";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Buscar tenant atual do usuário
  const { data: currentTenant } = useQuery({
    queryKey: ["current-tenant", user?.id],
    queryFn: async () => {
      // Primeiro busca o current_tenant_id do profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_tenant_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.current_tenant_id) return null;

      // Depois busca os dados do tenant com config
      const { data: tenant } = await supabase
        .from("tenants")
        .select("*, tenant_config(*)")
        .eq("id", profile.current_tenant_id)
        .single();

      return tenant;
    },
    enabled: !!user?.id,
  });

  // Aplicar branding do tenant atual no painel administrativo
  useTenantBranding(currentTenant as any);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar currentTenant={currentTenant} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
