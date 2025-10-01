import { useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTenantRouter } from "@/hooks/useTenantRouter";
import { TenantProvider } from "@/contexts/TenantContext";
import { PublicTenantRoutes } from "@/routes/PublicTenantRoutes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import Agents from "./pages/Agents";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";

function AppContent() {
  const { tenant, isLoading } = useTenantRouter();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Rotas principais/admin */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants"
        element={
          <ProtectedRoute>
            <Tenants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <Agents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        }
      />
      
      {/* Rotas de tenant - captura /:slug/* */}
      <Route 
        path="/:slug/*" 
        element={
          tenant ? (
            <TenantProvider tenant={tenant} isLoading={false}>
              <PublicTenantRoutes tenant={tenant} />
            </TenantProvider>
          ) : (
            <NotFound />
          )
        } 
      />
      
      {/* Catch-all para rotas não encontradas */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
