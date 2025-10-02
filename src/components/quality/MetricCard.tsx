import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  isLoading?: boolean;
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, isLoading, className }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={`p-6 hover-lift ${className}`}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 hover-lift border-border/50 backdrop-blur-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs font-medium ${trend >= 0 ? 'text-status-success' : 'text-status-error'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs último período
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
