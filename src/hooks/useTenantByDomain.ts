import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTenantByDomain(hostname: string) {
  return useQuery({
    queryKey: ["tenant-by-domain", hostname],
    queryFn: async () => {
      console.log("🔍 Detecting tenant for hostname:", hostname);
      
      // 1. Tentar buscar por domínio customizado verificado
      const { data: domainData, error: domainError } = await supabase
        .from("tenant_domains")
        .select(`
          tenant_id,
          tenants!inner (
            *,
            tenant_config (*)
          )
        `)
        .eq("domain", hostname)
        .eq("verified", true)
        .maybeSingle();

      if (domainError) {
        console.error("Error fetching tenant by domain:", domainError);
      }

      if (domainData?.tenants) {
        console.log("✅ Found tenant by custom domain:", domainData.tenants);
        return {
          ...domainData.tenants,
          tenant_config: Array.isArray(domainData.tenants.tenant_config)
            ? domainData.tenants.tenant_config[0]
            : domainData.tenants.tenant_config,
        };
      }

      // 2. Fallback: buscar por slug (ex: tenant-a.lovable.app)
      const slug = hostname.split(".")[0];
      console.log("🔄 Trying slug detection:", slug);
      
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("*, tenant_config(*)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (tenantError) {
        console.error("Error fetching tenant by slug:", tenantError);
      }

      if (tenant) {
        console.log("✅ Found tenant by slug:", tenant);
        return {
          ...tenant,
          tenant_config: Array.isArray(tenant.tenant_config)
            ? tenant.tenant_config[0]
            : tenant.tenant_config,
        };
      }

      console.log("❌ No tenant found for hostname:", hostname);
      return null;
    },
    enabled: !!hostname,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1,
  });
}
