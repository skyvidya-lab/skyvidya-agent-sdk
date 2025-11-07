import { useEffect } from 'react';

interface TenantConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

interface Tenant {
  tenant_config?: TenantConfig;
}

export function useTenantTheme(tenant?: Tenant | null, scopeSelector: string = '') {
  useEffect(() => {
    // Só aplicar tema se tenant existe e selector foi fornecido
    if (!tenant?.tenant_config || !scopeSelector) return;
    
    const element = document.querySelector(scopeSelector);
    if (!element || !(element instanceof HTMLElement)) return;
    
    const config = tenant.tenant_config;
    
    // Aplicar cores customizadas como CSS variables no elemento específico
    if (config.primary_color) {
      element.style.setProperty('--tenant-primary', config.primary_color);
    }
    
    if (config.secondary_color) {
      element.style.setProperty('--tenant-secondary', config.secondary_color);
    }
    
    if (config.accent_color) {
      element.style.setProperty('--tenant-accent', config.accent_color);
    }
    
    return () => {
      // Cleanup ao desmontar
      if (element instanceof HTMLElement) {
        element.style.removeProperty('--tenant-primary');
        element.style.removeProperty('--tenant-secondary');
        element.style.removeProperty('--tenant-accent');
      }
    };
  }, [tenant, scopeSelector]);
}
