import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TenantConfig {
  id: string;
  tenant_id: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  background_image_url?: string;
  hero_title: string;
  hero_subtitle: string;
  chat_placeholder: string;
  welcome_message: {
    title: string;
    subtitle: string;
  };
  enable_google_auth: boolean;
  enable_guest_access: boolean;
  enable_file_upload: boolean;
  enable_conversation_export: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  is_active: boolean;
  config?: TenantConfig;
  tenant_config?: TenantConfig;
}

export function useTenantRouter() {
  const location = useLocation();
  
  const detectTenantSlug = (): string | null => {
    const path = location.pathname;
    
    if (path.startsWith('/admin') || path === '/auth' || path === '/') {
      return null;
    }
    
    const slugMatch = path.match(/^\/([^\/]+)/);
    if (slugMatch && slugMatch[1]) {
      return slugMatch[1];
    }
    
    return null;
  };
  
  const tenantSlug = detectTenantSlug();
  
  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant-by-slug', tenantSlug],
    queryFn: async () => {
      if (!tenantSlug) return null;
      
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          tenant_config (*)
        `)
        .eq('slug', tenantSlug)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching tenant:', error);
        throw error;
      }
      
      return data as unknown as Tenant;
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
  });
  
  return {
    tenant,
    isLoading,
    error,
    isPublicUI: !!tenant,
    tenantSlug
  };
}
