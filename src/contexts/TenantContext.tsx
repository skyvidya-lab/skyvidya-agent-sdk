import { createContext, useContext, ReactNode } from 'react';
import { Tenant } from '@/hooks/useTenantRouter';

interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ 
  tenant, 
  isLoading, 
  children 
}: { 
  tenant: Tenant | null; 
  isLoading: boolean; 
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
