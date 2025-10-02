interface ScoreDisplayProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreDisplay({ score, size = 'md' }: ScoreDisplayProps) {
  if (score === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const getColor = (value: number) => {
    if (value >= 85) return 'text-status-success';
    if (value >= 70) return 'text-status-warning';
    return 'text-status-error';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <span className={`font-semibold ${getColor(score)} ${sizeClasses[size]}`}>
      {score.toFixed(0)}%
    </span>
  );
}
