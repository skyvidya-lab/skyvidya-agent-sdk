import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock, Ban } from "lucide-react";

interface StatusBadgeProps {
  status: 'passed' | 'failed' | 'warning' | 'pending' | 'running' | 'completed' | 'cancelled';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = {
    passed: {
      label: 'Aprovado',
      className: 'status-badge-success text-white border-0',
      icon: CheckCircle2,
    },
    failed: {
      label: 'Falhou',
      className: 'status-badge-error text-white border-0',
      icon: XCircle,
    },
    warning: {
      label: 'Alerta',
      className: 'status-badge-warning text-white border-0',
      icon: AlertCircle,
    },
    pending: {
      label: 'Pendente',
      className: 'status-badge-pending text-white border-0',
      icon: Clock,
    },
    running: {
      label: 'Em Execução',
      className: 'bg-blue-500 text-white border-0',
      icon: Clock,
    },
    completed: {
      label: 'Concluído',
      className: 'status-badge-success text-white border-0',
      icon: CheckCircle2,
    },
    cancelled: {
      label: 'Cancelado',
      className: 'bg-orange-500 text-white border-0',
      icon: Ban,
    },
  };

  const { label, className: badgeClass, icon: Icon } = config[status];

  return (
    <Badge className={`${badgeClass} ${className} font-medium`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}
