import { AppLayout } from "@/components/layout/AppLayout";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie suas preferências e informações da conta</p>
        </div>
        
        <GlassCard className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Perfil
            </CardTitle>
            <CardDescription className="text-base">Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                <p className="text-base font-medium">{user?.email}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">ID do Usuário</p>
                <p className="text-sm font-mono text-muted-foreground break-all">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
