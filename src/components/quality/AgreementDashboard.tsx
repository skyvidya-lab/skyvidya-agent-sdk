import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgreementAnalysis } from '@/hooks/useAgreementAnalysis';
import { useDeleteAgreementAnalysis } from '@/hooks/useDeleteAgreementAnalysis';
import { Target, AlertTriangle, CheckCircle, TrendingUp, Eye, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AgreementDetailView } from './AgreementDetailView';
import { AgreementHeatmap } from './AgreementHeatmap';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AgreementDashboardProps {
  workspaceId: string;
  benchmarkId?: string;
}

export const AgreementDashboard = ({ workspaceId, benchmarkId }: AgreementDashboardProps) => {
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const { data: agreements = [], isLoading } = useAgreementAnalysis(workspaceId, benchmarkId);
  const deleteAnalysis = useDeleteAgreementAnalysis();

  const avgKappa = agreements.length > 0
    ? agreements.reduce((sum, a) => sum + a.kappa_score, 0) / agreements.length
    : 0;

  const strongConsensus = agreements.filter(a => a.kappa_score >= 0.8).length;
  const requiresReview = agreements.filter(a => a.requires_human_review).length;
  const reviewCompleted = agreements.filter(a => a.human_review_completed).length;

  const getKappaColor = (kappa: number) => {
    if (kappa >= 0.8) return 'bg-green-500/10 text-green-700 dark:text-green-400';
    if (kappa >= 0.6) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    if (kappa >= 0.4) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-500/10 text-red-700 dark:text-red-400';
  };

  const getInterpretationLabel = (interpretation: string) => {
    const labels: Record<string, string> = {
      'almost_perfect': 'Quase Perfeito',
      'substantial': 'Substancial',
      'moderate': 'Moderado',
      'fair': 'Razoável',
      'slight': 'Leve',
      'poor': 'Fraco'
    };
    return labels[interpretation] || interpretation;
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando análise de concordância...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Kappa Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgKappa.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getInterpretationLabel(avgKappa >= 0.8 ? 'almost_perfect' : avgKappa >= 0.6 ? 'substantial' : 'moderate')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Consenso Forte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{strongConsensus}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {agreements.length > 0 ? ((strongConsensus / agreements.length) * 100).toFixed(0) : 0}% dos casos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Requer Revisão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{requiresReview}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reviewCompleted} revisados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Confiança Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {agreements.length > 0 ? ((strongConsensus / agreements.length) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em {agreements.length} análises
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <AgreementHeatmap workspaceId={workspaceId} benchmarkId={benchmarkId} />

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análises de Concordância</CardTitle>
              <CardDescription>
                Detalhamento da concordância entre agentes por caso de teste
              </CardDescription>
            </div>
            {agreements.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Análises
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar Análises de Concordância?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover permanentemente todas as análises de concordância (Kappa) 
                      deste workspace. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAnalysis.mutate({ workspaceId })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Limpar Tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos ({agreements.length})</TabsTrigger>
              <TabsTrigger value="strong">Consenso Forte ({strongConsensus})</TabsTrigger>
              <TabsTrigger value="review">Requer Revisão ({requiresReview})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caso de Teste</TableHead>
                    <TableHead>Kappa</TableHead>
                    <TableHead>Interpretação</TableHead>
                    <TableHead>Consenso</TableHead>
                    <TableHead>Discordância</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map(agreement => (
                  <TableRow key={agreement.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">
                      {agreement.test_case_id.substring(0, 8)}...
                    </TableCell>
                      <TableCell>
                        <Badge className={getKappaColor(agreement.kappa_score)}>
                          {agreement.kappa_score.toFixed(3)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getInterpretationLabel(agreement.interpretation)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agreement.consensus_category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={agreement.disagreement_level === 'high' ? 'destructive' : 'outline'}
                        >
                          {agreement.disagreement_level}
                        </Badge>
                      </TableCell>
                    <TableCell>
                      {agreement.requires_human_review && !agreement.human_review_completed && (
                        <Badge variant="secondary">Aguardando Revisão</Badge>
                      )}
                      {agreement.human_review_completed && (
                        <Badge variant="default">Revisado</Badge>
                      )}
                      {!agreement.requires_human_review && (
                        <Badge variant="outline">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedAgreementId(agreement.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="strong" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caso de Teste</TableHead>
                    <TableHead>Kappa</TableHead>
                    <TableHead>Consenso</TableHead>
                    <TableHead>Agentes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.filter(a => a.kappa_score >= 0.8).map(agreement => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-mono text-xs">
                        {agreement.test_case_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={getKappaColor(agreement.kappa_score)}>
                          {agreement.kappa_score.toFixed(3)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{agreement.consensus_category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {agreement.agent_ids.length} agentes
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="review" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caso de Teste</TableHead>
                    <TableHead>Kappa</TableHead>
                    <TableHead>Discordância</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.filter(a => a.requires_human_review).map(agreement => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-mono text-xs">
                        {agreement.test_case_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={getKappaColor(agreement.kappa_score)}>
                          {agreement.kappa_score.toFixed(3)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{agreement.disagreement_level}</Badge>
                      </TableCell>
                      <TableCell>
                        {agreement.human_review_completed ? (
                          <Badge variant="default">Revisado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!agreement.human_review_completed && (
                          <Button size="sm" variant="outline">
                            Revisar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>

      <AgreementDetailView
        agreementId={selectedAgreementId}
        workspaceId={workspaceId}
        open={!!selectedAgreementId}
        onOpenChange={(open) => !open && setSelectedAgreementId(null)}
      />
    </>
  );
};
