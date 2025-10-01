import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Tenant } from '@/hooks/useTenantRouter';
import { useEffect } from 'react';
import { TenantAuth } from '@/pages/public/TenantAuth';
import { TenantChat } from '@/pages/public/TenantChat';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useTenantBranding } from '@/hooks/useTenantBranding';

const TenantHomePage = ({ tenant }: { tenant: Tenant }) => {
  const config = tenant.tenant_config;
  const navigate = useNavigate();
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: config?.background_image_url 
          ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${config.background_image_url})`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-2xl w-full bg-background/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
        {config?.logo_url && (
          <img 
            src={config.logo_url} 
            alt={tenant.name} 
            className="h-20 mx-auto mb-6 object-contain" 
          />
        )}
        <h1 className="text-4xl font-bold mb-4" style={{ color: config?.primary_color }}>
          {config?.hero_title || tenant.name}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {config?.hero_subtitle || 'Bem-vindo'}
        </p>
        <div className="space-y-6">
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('auth')}>
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('auth?tab=interest')}>
              <Sparkles className="mr-2 h-4 w-4" />
              Manifestar Interesse
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tenant: <span className="font-mono">{tenant.slug}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export function PublicTenantRoutes({ tenant }: { tenant: Tenant }) {
  // Aplicar branding do tenant via hook centralizado
  useTenantBranding(tenant as any);
  
  return (
    <Routes>
      <Route index element={<TenantHomePage tenant={tenant} />} />
      <Route path="auth" element={<TenantAuth tenant={tenant} />} />
      <Route 
        path="chat" 
        element={
          <ProtectedRoute>
            <TenantChat tenant={tenant} />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
