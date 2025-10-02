import { useExecutionMetrics } from "@/hooks/useTestExecutions";
import { Activity, Clock, DollarSign, Target } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { Card, CardContent } from "@/components/ui/card";

interface QualityMetricsProps {
  tenantId: string;
}

export function QualityMetrics({ tenantId }: QualityMetricsProps) {
  const { data: metrics, isLoading } = useExecutionMetrics(tenantId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCard
            key={i}
            title=""
            value=""
            icon={Activity}
            isLoading
          />
        ))}
      </div>
    );
  }

  if (!metrics || metrics.total === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma execução ainda</h3>
          <p className="text-muted-foreground text-sm">
            Execute seu primeiro teste para ver as métricas de qualidade
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
      <MetricCard
        title="Precisão Média"
        value={`${metrics.avgAccuracy.toFixed(1)}%`}
        icon={Target}
        trend={metrics.avgAccuracy >= 85 ? 5 : -3}
        className="bg-gradient-to-br from-card to-status-success/5"
      />

      <MetricCard
        title="Taxa de Sucesso"
        value={`${metrics.successRate.toFixed(1)}%`}
        icon={Activity}
        trend={metrics.successRate >= 80 ? 8 : -2}
        className="bg-gradient-to-br from-card to-primary/5"
      />

      <MetricCard
        title="Velocidade Média"
        value={`${(metrics.avgSpeed / 1000).toFixed(2)}s`}
        icon={Clock}
        trend={metrics.avgSpeed < 2000 ? 12 : -5}
        className="bg-gradient-to-br from-card to-status-warning/5"
      />

      <MetricCard
        title="Custo Total"
        value={`$${metrics.totalCost.toFixed(2)}`}
        icon={DollarSign}
        className="bg-gradient-to-br from-card to-accent/5"
      />
    </div>
  );
}
