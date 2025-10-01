import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Filter, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { useAgentLogs, useAgentCallMetrics } from "@/hooks/useAgentLogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Logs() {
  const [logLevel, setLogLevel] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");

  const getDateRange = () => {
    const now = new Date();
    const ranges: Record<string, Date> = {
      "1h": new Date(now.getTime() - 60 * 60 * 1000),
      "24h": new Date(now.getTime() - 24 * 60 * 60 * 1000),
      "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    return ranges[timeRange];
  };

  const { data: logs = [], isLoading: logsLoading } = useAgentLogs({
    level: logLevel !== "all" ? logLevel : undefined,
    startDate: getDateRange(),
    limit: 200,
  });

  const { data: metrics = [], isLoading: metricsLoading } = useAgentCallMetrics({
    startDate: getDateRange(),
    limit: 200,
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info":
        return <Info className="h-4 w-4 text-info" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      success: "default",
      error: "destructive",
      timeout: "secondary",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Calculate metrics summary
  const metricsSummary = {
    total: metrics.length,
    success: metrics.filter((m) => m.status === "success").length,
    errors: metrics.filter((m) => m.status === "error").length,
    avgResponseTime: metrics.length > 0
      ? Math.round(
          metrics
            .filter((m) => m.response_time_ms)
            .reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / metrics.length
        )
      : 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs & Observabilidade</h1>
          <p className="text-muted-foreground">
            Monitore chamadas aos agentes e logs do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Última hora</SelectItem>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={logLevel} onValueChange={setLogLevel}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsSummary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {metricsSummary.total > 0
                ? Math.round((metricsSummary.success / metricsSummary.total) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {metricsSummary.errors}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsSummary.avgResponseTime}ms</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Métricas de Chamadas</TabsTrigger>
          <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Chamadas aos Agentes</CardTitle>
              <CardDescription>
                Detalhes de todas as chamadas aos agentes externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {metricsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    Carregando métricas...
                  </div>
                ) : metrics.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Nenhuma métrica encontrada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics.map((metric: any) => (
                      <div
                        key={metric.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {metric.agents?.name || "Unknown Agent"}
                            </span>
                            <Badge variant="outline">{metric.platform}</Badge>
                            {getStatusBadge(metric.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {metric.response_time_ms && (
                              <span className="mr-4">
                                ⏱️ {metric.response_time_ms}ms
                              </span>
                            )}
                            {metric.tokens_used && (
                              <span className="mr-4">
                                🎫 {metric.tokens_used} tokens
                              </span>
                            )}
                            <span>📝 {metric.message_length} caracteres</span>
                          </div>
                          {metric.error_message && (
                            <div className="text-sm text-destructive mt-1">
                              ❌ {metric.error_message}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {format(new Date(metric.created_at), "dd/MM/yyyy HH:mm:ss", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Eventos e logs estruturados do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {logsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    Carregando logs...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Nenhum log encontrado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">{log.message}</div>
                          {log.context && Object.keys(log.context).length > 0 && (
                            <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                              {JSON.stringify(log.context, null, 2)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
