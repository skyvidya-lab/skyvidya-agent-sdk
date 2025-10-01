import { useExecutionMetrics } from '@/hooks/useTestExecutions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Zap, DollarSign, CheckCircle } from 'lucide-react';

interface QualityMetricsProps {
  tenantId: string;
}

export const QualityMetrics = ({ tenantId }: QualityMetricsProps) => {
  const { data: metrics, isLoading } = useExecutionMetrics(tenantId);

  if (isLoading || !metrics) {
    return <div>Carregando métricas...</div>;
  }

  const metricsData = [
    {
      title: 'Acurácia Média',
      value: `${metrics.avgAccuracy.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${metrics.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Velocidade Média',
      value: `${metrics.avgSpeed.toFixed(0)}ms`,
      icon: Zap,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Custo Total',
      value: `$${metrics.totalCost.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metricsData.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.total} execuções
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
