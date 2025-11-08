import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { DesktopHeader } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  return (
    <SidebarProvider>
      <DesktopHeader />
      <MobileHeader currentTenant={currentTenant} />
      <div className="min-h-screen flex w-full pt-0 md:pt-14">
        <AppSidebar currentTenant={currentTenant} />
        <main className="flex-1 overflow-y-auto h-screen md:h-[calc(100vh-3.5rem)] pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
