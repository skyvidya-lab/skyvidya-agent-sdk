import { useEffect } from 'react';

interface TenantConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  default_theme?: 'light' | 'dark';
  light_theme_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  dark_theme_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
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
    
    // Detectar preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Usar tema configurado ou preferência do sistema
    const theme = config.default_theme || (prefersDark ? 'dark' : 'light');
    
    // Selecionar cores baseado no tema
    const colors = theme === 'dark' 
      ? config.dark_theme_colors 
      : config.light_theme_colors;
    
    // Aplicar cores customizadas como CSS variables no elemento específico
    if (colors?.primary) {
      element.style.setProperty('--tenant-primary', colors.primary);
    }
    
    if (colors?.secondary) {
      element.style.setProperty('--tenant-secondary', colors.secondary);
    }
    
    if (colors?.accent) {
      element.style.setProperty('--tenant-accent', colors.accent);
    }
    
    // Adicionar classe de tema para permitir estilos condicionais
    element.classList.toggle('dark-theme', theme === 'dark');
    element.classList.toggle('light-theme', theme === 'light');
    
    return () => {
      // Cleanup ao desmontar
      if (element instanceof HTMLElement) {
        element.style.removeProperty('--tenant-primary');
        element.style.removeProperty('--tenant-secondary');
        element.style.removeProperty('--tenant-accent');
        element.classList.remove('dark-theme', 'light-theme');
      }
    };
  }, [tenant, scopeSelector]);
}
