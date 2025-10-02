import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, FileQuestion, Users } from 'lucide-react';
import { useState } from 'react';
import { HumanReviewDialog } from './HumanReviewDialog';

interface AgreementDetailViewProps {
  agreementId: string | null;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AgreementDetailView = ({ agreementId, workspaceId, open, onOpenChange }: AgreementDetailViewProps) => {
  const [showReview, setShowReview] = useState(false);

  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement-detail', agreementId],
    queryFn: async () => {
      if (!agreementId) return null;

      const { data, error } = await supabase
        .from('agreement_analysis')
        .select(`
          *,
          test_cases:test_case_id(id, question, expected_answer, category)
        `)
        .eq('id', agreementId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!agreementId && open,
  });

  const { data: executions } = useQuery({
    queryKey: ['agreement-executions', agreementId],
    queryFn: async () => {
      if (!agreement) return [];
      
      const evidence = agreement.evidence as any;
      if (!evidence?.execution_ids) return [];

      const { data, error } = await supabase
        .from('test_executions')
        .select(`
          *,
          agents:agent_id(id, name, platform)
        `)
        .in('id', evidence.execution_ids);

      if (error) throw error;
      return data;
    },
    enabled: !!agreement,
  });

  const getKappaColor = (kappa: number) => {
    if (kappa >= 0.8) return 'text-green-600';
    if (kappa >= 0.6) return 'text-blue-600';
    if (kappa >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'EXCELLENT': 'bg-green-500/10 text-green-700 dark:text-green-400',
      'GOOD': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      'FAIR': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      'POOR': 'bg-red-500/10 text-red-700 dark:text-red-400',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  };

  if (isLoading || !agreement) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">Carregando detalhes...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const categorizedResponses = (agreement.evidence as any)?.categorized_responses || [];
  const categoryCounts = (agreement.evidence as any)?.category_counts || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              Análise de Concordância - Detalhes
            </DialogTitle>
            <DialogDescription>
              Análise detalhada da concordância entre agentes para este caso de teste
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Kappa Score Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score de Concordância (Kappa)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-5xl font-bold ${getKappaColor(agreement.kappa_score)}`}>
                      {agreement.kappa_score.toFixed(3)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {getInterpretationLabel(agreement.interpretation)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{agreement.consensus_category}</Badge>
                      <span className="text-sm text-muted-foreground">Consenso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agreement.disagreement_level === 'high' ? 'destructive' : 'outline'}>
                        {agreement.disagreement_level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Discordância</span>
                    </div>
                  </div>
                </div>

                {/* Consensus Visualization */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Distribuição de Respostas:</p>
                  <div className="space-y-1">
                    {categoryCounts.map((item: any) => {
                      const percentage = (item.count / categorizedResponses.length) * 100;
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <Badge className={getCategoryColor(item.category)}>
                              {item.category}
                            </Badge>
                            <span className="text-muted-foreground">
                              {item.count} agentes ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Case Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileQuestion className="h-5 w-5" />
                  Caso de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Categoria:</p>
                  <Badge variant="outline">{agreement.test_cases?.category}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pergunta:</p>
                  <p className="text-sm">{agreement.test_cases?.question}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Resposta Esperada:</p>
                  <p className="text-sm text-muted-foreground">
                    {agreement.test_cases?.expected_answer}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agent Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Respostas dos Agentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executions?.map((exec: any, idx: number) => (
                    <div key={exec.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{exec.agents?.name}</span>
                          <Badge variant="outline">{exec.agents?.platform}</Badge>
                          <Badge className={getCategoryColor(categorizedResponses[idx])}>
                            {categorizedResponses[idx]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {exec.status === 'passed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant="outline">{exec.status}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Similaridade:</span>
                          <span className="ml-2 font-medium">{exec.similarity_score?.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Factual:</span>
                          <span className="ml-2 font-medium">{exec.factual_accuracy?.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Relevância:</span>
                          <span className="ml-2 font-medium">{exec.relevance_score?.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Resposta:</p>
                        <p className="text-sm bg-muted p-3 rounded">
                          {exec.actual_answer || 'Sem resposta'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Human Review Section */}
            {agreement.requires_human_review && (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Revisão Humana
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agreement.human_review_completed ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Revisão Concluída</span>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {agreement.human_review_notes}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Este caso apresenta alta discordância entre os agentes e requer revisão manual.
                      </p>
                      <Button onClick={() => setShowReview(true)}>
                        Iniciar Revisão Humana
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <HumanReviewDialog
        agreementId={agreement.id}
        workspaceId={workspaceId}
        open={showReview}
        onOpenChange={setShowReview}
      />
    </>
  );
};
