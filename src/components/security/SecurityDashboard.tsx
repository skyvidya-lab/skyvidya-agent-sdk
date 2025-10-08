import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useSecurityTestExecutions } from '@/hooks/useSecurityTestExecutions';
import { useSecurityComplianceReports } from '@/hooks/useSecurityComplianceReports';
import { Progress } from '@/components/ui/progress';

interface SecurityDashboardProps {
  workspaceId: string;
  agentId?: string;
}

export function SecurityDashboard({ workspaceId, agentId }: SecurityDashboardProps) {
  const { data: executions = [] } = useSecurityTestExecutions(workspaceId);
  const { data: reports = [] } = useSecurityComplianceReports(workspaceId);

  const filteredExecutions = agentId 
    ? executions.filter(e => e.agent_id === agentId)
    : executions;

  const latestReport = reports[0];

  const totalTests = filteredExecutions.length;
  const passed = filteredExecutions.filter(e => e.security_status === 'passed').length;
  const failed = filteredExecutions.filter(e => e.security_status === 'failed').length;
  const warning = filteredExecutions.filter(e => e.security_status === 'warning').length;
  
  const complianceScore = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0;
  const vulnerabilities = filteredExecutions.filter(e => e.vulnerability_detected).length;
  const criticalVulns = filteredExecutions.filter(e => e.risk_level === 'critical' && e.vulnerability_detected).length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: 'Excelente', variant: 'default' as const };
    if (score >= 80) return { label: 'Bom', variant: 'secondary' as const };
    if (score >= 70) return { label: 'Aceitável', variant: 'outline' as const };
    return { label: 'Crítico', variant: 'destructive' as const };
  };

  const scoreNum = parseFloat(complianceScore as string);
  const scoreStatus = getScoreStatus(scoreNum);

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Score de Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(scoreNum)}`}>
              {complianceScore}%
            </div>
            <Badge variant={scoreStatus.variant} className="mt-2">
              {scoreStatus.label}
            </Badge>
            <Progress value={scoreNum} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Testes Realizados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{passed} aprovados</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <span>{failed} reprovados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilidades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{vulnerabilities}</div>
            {criticalVulns > 0 && (
              <Badge variant="destructive" className="mt-2">
                {criticalVulns} Críticas
              </Badge>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Detectadas em {totalTests} testes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Último Relatório</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestReport ? (
              <>
                <div className="text-2xl font-bold">
                  {latestReport.compliance_score?.toFixed(1)}%
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(latestReport.generated_at).toLocaleDateString('pt-BR')}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum relatório gerado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Vulnerabilities Alert */}
      {criticalVulns > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Ação Imediata Necessária
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">
              {criticalVulns} vulnerabilidade{criticalVulns > 1 ? 's' : ''} crítica{criticalVulns > 1 ? 's' : ''} detectada{criticalVulns > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 dark:text-red-300">
              Vulnerabilidades críticas podem comprometer completamente a segurança do agente. 
              Revise os testes reprovados e implemente correções imediatamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Test Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Testes de Segurança</CardTitle>
          <CardDescription>
            Status dos últimos {totalTests} testes executados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalTests === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum teste de segurança executado ainda. Importe os casos de teste e execute o primeiro teste.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredExecutions.slice(0, 10).map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">
                      {execution.question_asked}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(execution.executed_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {execution.vulnerability_detected && (
                      <Badge variant="destructive" className="text-xs">
                        {execution.risk_level}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        execution.security_status === 'passed'
                          ? 'default'
                          : execution.security_status === 'warning'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {execution.security_status === 'passed' ? 'Passou' : 
                       execution.security_status === 'warning' ? 'Aviso' : 'Falhou'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
