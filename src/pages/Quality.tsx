import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { TestCaseList } from "@/components/quality/TestCaseList";
import { TestExecutionList } from "@/components/quality/TestExecutionList";
import { QualityMetrics } from "@/components/quality/QualityMetrics";
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
import { useState } from "react";
import { TestCaseForm } from "@/components/quality/TestCaseForm";
import { useExportTestCases, useTestCases } from "@/hooks/useTestCases";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Quality() {
  const { user } = useAuth();
  const [showNewTestCase, setShowNewTestCase] = useState(false);

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

  const { data: testCases } = useTestCases(profile?.current_tenant_id || "");
  const exportTestCases = useExportTestCases();

  const handleExport = () => {
    if (!testCases || testCases.length === 0) {
      toast.error("Nenhum caso de teste para exportar");
      return;
    }
    exportTestCases.mutate(testCases);
  };

  return (
    <AppLayout>
      {profile?.current_tenant_id ? (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Qualidade & Testes
              </h1>
              <p className="text-muted-foreground mt-2">
                Validação automatizada e métricas de performance dos seus agentes
              </p>
            </div>
          </div>

          {/* Metrics Overview */}
          <QualityMetrics tenantId={profile.current_tenant_id} />

          {/* Main Content Tabs */}
          <Tabs defaultValue="test-cases" className="space-y-4">
            <TabsList>
              <TabsTrigger value="test-cases">Casos de Teste</TabsTrigger>
              <TabsTrigger value="executions">Histórico de Execuções</TabsTrigger>
            </TabsList>

            <TabsContent value="test-cases" className="space-y-4 animate-fade-in">
              <GlassCard>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Casos de Teste</CardTitle>
                      <CardDescription className="text-base mt-1">
                        Gerencie e execute casos de teste para validar seus agentes
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExport} className="hover:bg-primary/10">
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                      <Button size="sm" onClick={() => setShowNewTestCase(true)} className="shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Caso
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <TestCaseList tenantId={profile.current_tenant_id} />
                </CardContent>
              </GlassCard>

              <TestCaseForm 
                tenantId={profile.current_tenant_id}
                open={showNewTestCase} 
                onOpenChange={setShowNewTestCase}
              />
            </TabsContent>

            <TabsContent value="executions" className="space-y-4 animate-fade-in">
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-2xl">Histórico de Execuções</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Visualize o histórico completo de execuções de teste
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TestExecutionList tenantId={profile.current_tenant_id} />
                </CardContent>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full p-6">
          <p className="text-muted-foreground">Selecione um tenant para visualizar a qualidade</p>
        </div>
      )}
    </AppLayout>
  );
}
