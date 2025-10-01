import { useEffect } from "react";
import { Tenant } from "./useTenantRouter";

/**
 * Hook centralizado para aplicar branding do tenant em toda a aplicação.
 * Aplica cores (CSS variables), fontes customizadas (Google Fonts), favicon e document.title.
 */
export function useTenantBranding(tenant: Tenant | null | undefined) {
  useEffect(() => {
    if (!tenant?.tenant_config) return;

    const config = tenant.tenant_config;

    // Aplicar CSS variables para cores
    const root = document.documentElement;
    if (config.primary_color) {
      root.style.setProperty("--primary", hexToHSL(config.primary_color));
    }
    if (config.secondary_color) {
      root.style.setProperty("--secondary", hexToHSL(config.secondary_color));
    }
    if (config.accent_color) {
      root.style.setProperty("--accent", hexToHSL(config.accent_color));
    }

    // Atualizar document.title
    document.title = tenant.name || "Multi-Tenant Platform";

    // Atualizar favicon se tiver logo
    if (tenant.logo_url) {
      updateFavicon(tenant.logo_url);
    }

    // Carregar fonte customizada do Google Fonts
    if (config.font_family && config.font_family !== "Inter") {
      loadGoogleFont(config.font_family);
      root.style.setProperty("--font-sans", `"${config.font_family}", sans-serif`);
    }

    return () => {
      // Cleanup: restaurar valores padrão ao desmontar
      root.style.removeProperty("--primary");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--font-sans");
      document.title = "Multi-Tenant Platform";
    };
  }, [tenant]);

  return {
    isApplied: !!tenant?.tenant_config,
    tenantConfig: tenant?.tenant_config,
  };
}

/**
 * Converte HEX (#RRGGBB) para HSL (hue, saturation%, lightness%)
 * Formato esperado pelo CSS: "210 100% 50%"
 */
export function hexToHSL(hex: string): string {
  // Remove # se presente
  hex = hex.replace("#", "");

  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Converte para formato CSS: "210 100% 50%"
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Carrega fonte do Google Fonts dinamicamente
 */
function loadGoogleFont(fontFamily: string) {
  const linkId = "google-font-tenant";
  
  // Remove link anterior se existir
  const existingLink = document.getElementById(linkId);
  if (existingLink) {
    existingLink.remove();
  }

  // Cria novo link
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
    / /g,
    "+"
  )}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/**
 * Atualiza o favicon da página
 */
function updateFavicon(url: string) {
  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  
  link.href = url;
}
