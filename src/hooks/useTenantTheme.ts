import { useEffect } from 'react';

interface TenantConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

interface Tenant {
  tenant_config?: TenantConfig;
}

export function useTenantTheme(tenant?: Tenant | null) {
  useEffect(() => {
    if (!tenant?.tenant_config) return;
    
    const root = document.documentElement;
    const config = tenant.tenant_config;
    
    // Aplicar cores customizadas como CSS variables
    if (config.primary_color) {
      root.style.setProperty('--tenant-primary', config.primary_color);
    }
    
    if (config.secondary_color) {
      root.style.setProperty('--tenant-secondary', config.secondary_color);
    }
    
    if (config.accent_color) {
      root.style.setProperty('--tenant-accent', config.accent_color);
    }
    
    return () => {
      // Cleanup ao desmontar
      root.style.removeProperty('--tenant-primary');
      root.style.removeProperty('--tenant-secondary');
      root.style.removeProperty('--tenant-accent');
    };
  }, [tenant]);
}
