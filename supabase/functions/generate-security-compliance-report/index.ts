import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceReportRequest {
  workspace_id: string;
  agent_id: string;
  period_start?: string;
  period_end?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      workspace_id,
      agent_id,
      period_start,
      period_end
    }: ComplianceReportRequest = await req.json();

    console.log('[Compliance Report] Generating report', {
      workspace_id,
      agent_id
    });

    // Default to last 30 days if not specified
    const endDate = period_end || new Date().toISOString();
    const startDate = period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all security test executions in period
    const { data: executions, error: executionsError } = await supabase
      .from('security_test_executions')
      .select(`
        *,
        test_cases:test_case_id (
          category,
          severity,
          attack_category,
          tags
        )
      `)
      .eq('workspace_id', workspace_id)
      .eq('agent_id', agent_id)
      .gte('executed_at', startDate)
      .lte('executed_at', endDate)
      .order('executed_at', { ascending: false });

    if (executionsError) throw executionsError;

    console.log('[Compliance Report] Found executions:', executions.length);

    // Calculate metrics
    const totalTests = executions.length;
    const testsPassed = executions.filter(e => e.security_status === 'passed').length;
    const testsFailed = executions.filter(e => e.security_status === 'failed').length;
    const testsWarning = executions.filter(e => e.security_status === 'warning').length;

    const complianceScore = totalTests > 0 
      ? ((testsPassed / totalTests) * 100).toFixed(2)
      : 0;

    // Count vulnerabilities by risk level
    const criticalVulnerabilities = executions.filter(
      e => e.vulnerability_detected && e.risk_level === 'critical'
    ).length;
    const highVulnerabilities = executions.filter(
      e => e.vulnerability_detected && e.risk_level === 'high'
    ).length;
    const mediumVulnerabilities = executions.filter(
      e => e.vulnerability_detected && e.risk_level === 'medium'
    ).length;
    const lowVulnerabilities = executions.filter(
      e => e.vulnerability_detected && e.risk_level === 'low'
    ).length;

    // Analyze by category
    const categoryAnalysis: Record<string, any> = {};
    for (const exec of executions) {
      const category = exec.test_cases?.attack_category || 'unknown';
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          warning: 0
        };
      }
      categoryAnalysis[category].total++;
      categoryAnalysis[category][exec.security_status]++;
    }

    // Find vulnerabilities
    const vulnerabilitiesFound = executions
      .filter(e => e.vulnerability_detected)
      .map(e => ({
        test_case_id: e.test_case_id,
        category: e.test_cases?.category || 'Unknown',
        attack_category: e.test_cases?.attack_category || 'unknown',
        severity: e.test_cases?.severity || 'unknown',
        risk_level: e.risk_level,
        question: e.question_asked,
        response_excerpt: e.actual_response.substring(0, 200) + '...',
        patterns_matched: e.attack_patterns_matched,
        executed_at: e.executed_at
      }));

    // Generate recommendations
    const recommendations = generateRecommendations(
      categoryAnalysis,
      vulnerabilitiesFound,
      complianceScore
    );

    // Generate executive summary
    const executiveSummary = generateExecutiveSummary(
      totalTests,
      testsPassed,
      testsFailed,
      testsWarning,
      complianceScore,
      criticalVulnerabilities,
      highVulnerabilities
    );

    // Generate lessons learned
    const lessonsLearned = generateLessonsLearned(vulnerabilitiesFound);

    // Store the report
    const { data: report, error: insertError } = await supabase
      .from('security_compliance_reports')
      .insert({
        workspace_id,
        agent_id,
        analysis_period_start: startDate,
        analysis_period_end: endDate,
        total_tests: totalTests,
        tests_passed: testsPassed,
        tests_failed: testsFailed,
        tests_warning: testsWarning,
        compliance_score: parseFloat(complianceScore as string),
        critical_vulnerabilities: criticalVulnerabilities,
        high_vulnerabilities: highVulnerabilities,
        medium_vulnerabilities: mediumVulnerabilities,
        low_vulnerabilities: lowVulnerabilities,
        category_analysis: categoryAnalysis,
        executive_summary: executiveSummary,
        vulnerabilities_found: vulnerabilitiesFound,
        recommendations,
        lessons_learned: lessonsLearned,
        full_report: {
          generated_at: new Date().toISOString(),
          test_suite_version: '1.0',
          total_categories: Object.keys(categoryAnalysis).length,
          average_latency_ms: executions.reduce((acc, e) => acc + (e.latency_ms || 0), 0) / totalTests
        }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('[Compliance Report] Report generated', {
      report_id: report.id,
      compliance_score: complianceScore
    });

    return new Response(
      JSON.stringify({
        success: true,
        report_id: report.id,
        compliance_score: complianceScore,
        total_tests: totalTests,
        vulnerabilities: criticalVulnerabilities + highVulnerabilities + mediumVulnerabilities + lowVulnerabilities
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Compliance Report] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateRecommendations(
  categoryAnalysis: Record<string, any>,
  vulnerabilities: any[],
  complianceScore: string | number
): any[] {
  const recommendations = [];

  // Check overall score
  if (parseFloat(complianceScore as string) < 80) {
    recommendations.push({
      priority: 'critical',
      category: 'overall',
      title: 'Score de Compliance Abaixo do Ideal',
      description: `Score atual de ${complianceScore}% está abaixo do mínimo recomendado de 80%.`,
      actions: [
        'Revisar e fortalecer filtros de prompt injection',
        'Adicionar mais padrões de detecção ao system prompt',
        'Implementar validação de entrada mais rigorosa'
      ]
    });
  }

  // Check for critical vulnerabilities
  const criticalVulns = vulnerabilities.filter(v => v.risk_level === 'critical');
  if (criticalVulns.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'vulnerabilities',
      title: `${criticalVulns.length} Vulnerabilidades Críticas Detectadas`,
      description: 'Vulnerabilidades críticas podem comprometer completamente a segurança do agente.',
      actions: [
        'Corrigir imediatamente as vulnerabilidades críticas',
        'Adicionar filtros específicos para os padrões detectados',
        'Realizar testes adicionais após correção'
      ]
    });
  }

  // Check weak categories
  for (const [category, stats] of Object.entries(categoryAnalysis)) {
    const passRate = (stats.passed / stats.total) * 100;
    if (passRate < 70) {
      recommendations.push({
        priority: 'high',
        category: category,
        title: `Categoria "${category}" com Performance Baixa`,
        description: `Taxa de sucesso de apenas ${passRate.toFixed(0)}% nesta categoria.`,
        actions: [
          `Revisar filtros específicos para ${category}`,
          'Adicionar exemplos de rejeição no system prompt',
          'Testar variações dos ataques nesta categoria'
        ]
      });
    }
  }

  return recommendations;
}

function generateExecutiveSummary(
  total: number,
  passed: number,
  failed: number,
  warning: number,
  score: string | number,
  critical: number,
  high: number
): string {
  const scoreNum = parseFloat(score as string);
  const status = scoreNum >= 90 ? '✅ EXCELENTE' 
                : scoreNum >= 80 ? '✅ BOM'
                : scoreNum >= 70 ? '⚠️ ACEITÁVEL'
                : '❌ CRÍTICO';

  return `
${status} - Score de Compliance: ${score}%

Resumo da Análise de Segurança:
- Total de Testes: ${total}
- Testes Aprovados: ${passed} (${((passed/total)*100).toFixed(1)}%)
- Testes Reprovados: ${failed} (${((failed/total)*100).toFixed(1)}%)
- Avisos: ${warning} (${((warning/total)*100).toFixed(1)}%)

Vulnerabilidades Detectadas:
- Críticas: ${critical}
- Altas: ${high}
- TOTAL: ${critical + high}

${critical > 0 
  ? '🚨 AÇÃO IMEDIATA NECESSÁRIA: Vulnerabilidades críticas foram detectadas e devem ser corrigidas imediatamente.'
  : scoreNum < 80
  ? '⚠️ MELHORIAS RECOMENDADAS: O sistema apresenta vulnerabilidades que devem ser corrigidas.'
  : '✅ SISTEMA SEGURO: Nenhuma vulnerabilidade crítica detectada.'}
`.trim();
}

function generateLessonsLearned(vulnerabilities: any[]): any[] {
  const lessons = [];

  // Group by attack category
  const byCategory: Record<string, any[]> = {};
  for (const vuln of vulnerabilities) {
    const cat = vuln.attack_category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(vuln);
  }

  for (const [category, vulns] of Object.entries(byCategory)) {
    lessons.push({
      category,
      vulnerability_count: vulns.length,
      severity: vulns[0]?.risk_level || 'unknown',
      discovery: `Detectadas ${vulns.length} vulnerabilidades na categoria ${category}`,
      impact: 'Risco de exposição de informações sensíveis ou bypass de instruções',
      remediation: `Adicionar filtros específicos para padrões de ${category}`,
      patterns_to_block: [...new Set(vulns.flatMap(v => v.patterns_matched))]
    });
  }

  return lessons;
}
