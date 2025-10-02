import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBenchmarks, useBenchmarkResults } from "@/hooks/useBenchmarks";
import { useCalculateAgreement } from "@/hooks/useAgreementAnalysis";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Target, TrendingUp, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Benchmarks() {
  const { user } = useAuth();
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);

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

  const { data: benchmarks = [], isLoading } = useBenchmarks(profile?.current_tenant_id || "");
  const { data: benchmarkResults, isLoading: loadingResults } = useBenchmarkResults(selectedBenchmarkId || "");
  const calculateAgreement = useCalculateAgreement();

  const handleCalculateAgreement = async (benchmarkId: string) => {
    if (!profile?.current_tenant_id) return;

    const benchmark = benchmarks.find(b => b.id === benchmarkId);
    if (!benchmark) return;

    try {
      await calculateAgreement.mutateAsync({
        workspaceId: profile.current_tenant_id,
        benchmarkId,
        testCaseIds: benchmark.test_case_ids,
        agentIds: benchmark.agent_ids,
      });
    } catch (error) {
      console.error('Error calculating agreement:', error);
    }
  };

  return (
    <AppLayout>
      {profile?.current_tenant_id ? (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Benchmarks
              </h1>
              <p className="text-muted-foreground mt-2">
                Compare a performance de múltiplos agentes
              </p>
            </div>
            <Button size="sm" className="shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Benchmark
            </Button>
          </div>

          {/* Benchmarks List */}
          <Card>
            <CardHeader>
              <CardTitle>Benchmarks Executados</CardTitle>
              <CardDescription>
                Selecione um benchmark para ver os resultados detalhados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Carregando benchmarks...</div>
              ) : benchmarks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Nenhum benchmark criado</h3>
                      <p className="text-muted-foreground mb-4">
                        Crie seu primeiro benchmark para comparar agentes
                      </p>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Benchmark
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Agentes</TableHead>
                      <TableHead>Casos de Teste</TableHead>
                      <TableHead>Execuções</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benchmarks.map((benchmark) => (
                      <TableRow 
                        key={benchmark.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedBenchmarkId(benchmark.id)}
                      >
                        <TableCell className="font-medium">{benchmark.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{benchmark.agent_ids.length} agentes</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{benchmark.test_case_ids.length} testes</Badge>
                        </TableCell>
                        <TableCell>
                          {benchmark.agent_ids.length * benchmark.test_case_ids.length}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(benchmark.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCalculateAgreement(benchmark.id);
                            }}
                            disabled={calculateAgreement.isPending}
                          >
                            <Target className="h-4 w-4 mr-2" />
                            Analisar Concordância
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Benchmark Results */}
          {selectedBenchmarkId && benchmarkResults && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados: {benchmarkResults.benchmark.name}</CardTitle>
                <CardDescription>
                  {benchmarkResults.benchmark.description || "Comparação detalhada entre agentes"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{benchmarkResults.total_executions}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Agentes Testados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{benchmarkResults.results.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Melhor Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.max(...benchmarkResults.results.map(r => r.avg_similarity_score)).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Menor Latência</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.min(...benchmarkResults.results.map(r => r.avg_speed_ms)).toFixed(0)}ms
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Results Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agente</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Factual</TableHead>
                      <TableHead>Latência (ms)</TableHead>
                      <TableHead>Taxa de Sucesso</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead>Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benchmarkResults.results.map((result) => (
                      <TableRow key={result.agent_id}>
                        <TableCell className="font-medium">{result.agent_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.agent_platform}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              result.avg_similarity_score >= 85 
                                ? 'bg-green-500/10 text-green-700' 
                                : result.avg_similarity_score >= 70 
                                ? 'bg-yellow-500/10 text-yellow-700'
                                : 'bg-red-500/10 text-red-700'
                            }
                          >
                            {result.avg_similarity_score.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {result.avg_factual_accuracy.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{result.avg_speed_ms.toFixed(0)}ms</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {result.success_rate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>${result.total_cost_usd.toFixed(4)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {result.total_tokens.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full p-6">
          <p className="text-muted-foreground">Selecione um tenant para visualizar benchmarks</p>
        </div>
      )}
    </AppLayout>
  );
}
