import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useMetrics";
import { Building2, Bot, MessageSquare, Activity, TrendingUp, Clock, Zap, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LoadingState } from "@/components/ui/loading-state";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("current_tenant_id")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: tenantsCount } = useQuery({
    queryKey: ["tenants-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: isLoadingStats } = useDashboardStats(
    profile?.current_tenant_id
  );

  if (isLoadingStats) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard Executivo
            </h1>
            <p className="text-muted-foreground mt-2">Visão 360° do seu ecossistema de IA</p>
          </div>
          <LoadingState type="card" count={4} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-6">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-2">Visão 360° do seu ecossistema de IA</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <GlassCard className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total de Workspaces</p>
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold tracking-tight">{tenantsCount || 0}</div>
              <div className="flex items-center gap-1 text-xs text-status-success mt-2">
                <ArrowUp className="h-3 w-3" />
                <span>Empresas ativas</span>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-1/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Agentes Ativos</p>
              <div className="rounded-lg bg-chart-1/10 p-2">
                <Bot className="h-4 w-4 text-chart-1" />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stats?.activeAgents || 0}
                <span className="text-lg text-muted-foreground font-normal">
                  {" "}/{" "}{stats?.totalAgents || 0}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Activity className="h-3 w-3" />
                <span>Agents online</span>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-2/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Conversas Ativas</p>
              <div className="rounded-lg bg-chart-2/10 p-2">
                <MessageSquare className="h-4 w-4 text-chart-2" />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stats?.activeConversations || 0}
                <span className="text-lg text-muted-foreground font-normal">
                  {" "}/{" "}{stats?.totalConversations || 0}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <MessageSquare className="h-3 w-3" />
                <span>Diálogos em andamento</span>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-3/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Mensagens (30d)</p>
              <div className="rounded-lg bg-chart-3/10 p-2">
                <TrendingUp className="h-4 w-4 text-chart-3" />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.totalMessages || 0}</div>
              <div className="flex items-center gap-1 text-xs text-status-success mt-2">
                <ArrowUp className="h-3 w-3" />
                <span>+24% vs mês anterior</span>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <GlassCard className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-status-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Tempo Médio de Resposta</p>
              <div className="rounded-lg bg-status-warning/10 p-2">
                <Clock className="h-4 w-4 text-status-warning" />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stats?.avgResponseTime || 0}
                <span className="text-lg text-muted-foreground font-normal"> ms</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-status-success mt-2">
                <ArrowDown className="h-3 w-3" />
                <span>-12% mais rápido</span>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-4/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Tokens Utilizados</p>
              <div className="rounded-lg bg-chart-4/10 p-2">
                <Zap className="h-4 w-4 text-chart-4" />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stats?.totalTokens?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Zap className="h-3 w-3" />
                <span>Processados este mês</span>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-5/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Atividade Recente</p>
              <div className="rounded-lg bg-chart-5/10 p-2">
                <Activity className="h-4 w-4 text-chart-5" />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.recentActivity || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">respostas nos últimos 30 dias</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Messages Over Time */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Volume de Mensagens</GlassCardTitle>
              <p className="text-sm text-muted-foreground">Interações ao longo do tempo</p>
            </GlassCardHeader>
            <GlassCardContent>
              {stats?.messagesByDay && stats.messagesByDay.length > 0 ? (
                <ChartContainer
                  config={{
                    user: {
                      label: "Usuário",
                      color: "hsl(var(--chart-1))",
                    },
                    assistant: {
                      label: "Assistente",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[320px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.messagesByDay}>
                      <defs>
                        <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAssistant" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="user"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={1}
                        fill="url(#colorUser)"
                        name="Usuário"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="assistant"
                        stroke="hsl(var(--chart-2))"
                        fillOpacity={1}
                        fill="url(#colorAssistant)"
                        name="Assistente"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Messages by Agent */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Mensagens por Agente</GlassCardTitle>
              <p className="text-sm text-muted-foreground">Performance por assistant</p>
            </GlassCardHeader>
            <GlassCardContent>
              {stats?.messagesByAgent && stats.messagesByAgent.length > 0 ? (
                <ChartContainer
                  config={{
                    messages: {
                      label: "Mensagens",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[320px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.messagesByAgent}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={1}/>
                          <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                      <XAxis 
                        dataKey="agent" 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="messages"
                        fill="url(#barGradient)"
                        name="Mensagens"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  </div>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
