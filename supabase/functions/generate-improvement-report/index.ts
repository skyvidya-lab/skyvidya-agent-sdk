import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateReportRequest {
  workspace_id: string;
  agent_id: string;
  report_types: ('knowledge_base' | 'system_prompt')[];
  min_score_threshold?: number;
  analysis_period_days?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      workspace_id,
      agent_id,
      report_types,
      min_score_threshold = 70,
      analysis_period_days = 30,
    }: GenerateReportRequest = await req.json();

    console.log(`[generate-improvement-report] Starting for agent ${agent_id}`);

    // Fetch agent data
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('name, system_prompt, knowledge_base')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    // Fetch failed executions
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - analysis_period_days);

    const { data: executions, error: execError } = await supabase
      .from('test_executions')
      .select(`
        id,
        question_asked,
        expected_answer,
        actual_answer,
        similarity_score,
        factual_accuracy,
        relevance_score,
        status,
        cognitive_gaps,
        improvement_suggestions,
        executed_at,
        test_case_id,
        test_cases (category, tags)
      `)
      .eq('workspace_id', workspace_id)
      .eq('agent_id', agent_id)
      .gte('executed_at', periodStart.toISOString())
      .or(`status.eq.failed,similarity_score.lt.${min_score_threshold},factual_accuracy.lt.${min_score_threshold},relevance_score.lt.${min_score_threshold}`)
      .order('executed_at', { ascending: false })
      .limit(100);

    if (execError) {
      throw new Error(`Failed to fetch executions: ${execError.message}`);
    }

    if (!executions || executions.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'Nenhuma execução falhada encontrada para análise',
          reports_generated: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`[generate-improvement-report] Found ${executions.length} failed executions`);

    // Group by category
    const executionsByCategory = executions.reduce((acc, exec) => {
      const category = (exec.test_cases as any)?.category || 'Sem Categoria';
      if (!acc[category]) acc[category] = [];
      acc[category].push(exec);
      return acc;
    }, {} as Record<string, typeof executions>);

    // Generate reports
    const generatedReports = [];

    for (const report_type of report_types) {
      console.log(`[generate-improvement-report] Generating ${report_type} report`);

      let systemPrompt = '';
      let userPrompt = '';

      if (report_type === 'knowledge_base') {
        systemPrompt = `Você é um especialista em engenharia de conhecimento e curadoria de bases de conhecimento para agentes de IA. Analise as falhas e gere conteúdo estruturado em markdown para ADICIONAR/ANEXAR à base de conhecimento existente.`;

        userPrompt = `CONTEXTO DO AGENTE:
Nome: ${agent.name}
System Prompt: ${agent.system_prompt || 'Não definido'}
Base de Conhecimento Atual: ${agent.knowledge_base || 'Vazia'}

EXECUÇÕES FALHADAS (${executions.length} casos):
${Object.entries(executionsByCategory)
  .map(
    ([cat, execs]) => `
Categoria: ${cat} (${execs.length} falhas)
${execs.slice(0, 5).map((e, i) => `
${i + 1}. Pergunta: "${e.question_asked}"
   Esperado: "${e.expected_answer}"
   Obtido: "${e.actual_answer || 'Sem resposta'}"
   Scores: Similarity ${e.similarity_score || 0}%, Factual ${e.factual_accuracy || 0}%, Relevance ${e.relevance_score || 0}%
   Gaps: ${JSON.stringify(e.cognitive_gaps || [])}
`).join('\n')}
`
  )
  .join('\n')}

TAREFA:
Gere um documento JSON estruturado para COMPLEMENTAR a base de conhecimento. Forneça conteúdo markdown rico, detalhado e acionável para cada categoria problemática.

Retorne APENAS um JSON válido neste formato:
{
  "title": "Complemento à Base de Conhecimento - ${new Date().toLocaleDateString('pt-BR')}",
  "summary": "Resumo executivo das lacunas identificadas",
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "category": "Categoria do teste",
      "issue": "Descrição da lacuna identificada",
      "suggested_addition": "Conteúdo markdown completo para adicionar à KB",
      "evidence": [
        {
          "test_case_question": "Pergunta do caso de teste",
          "expected_answer": "Resposta esperada",
          "actual_answer": "Resposta obtida",
          "scores": {"similarity": 0, "factual": 0, "relevance": 0}
        }
      ]
    }
  ]
}`;
      } else {
        // system_prompt report
        systemPrompt = `Você é um especialista em prompt engineering e otimização de system prompts para agentes de IA. Analise as falhas e sugira melhorias específicas ao system prompt.`;

        userPrompt = `CONTEXTO DO AGENTE:
Nome: ${agent.name}
System Prompt Atual: ${agent.system_prompt || 'Não definido'}
Base de Conhecimento: ${agent.knowledge_base || 'Vazia'}

EXECUÇÕES FALHADAS (${executions.length} casos):
${Object.entries(executionsByCategory)
  .map(
    ([cat, execs]) => `
Categoria: ${cat} (${execs.length} falhas)
${execs.slice(0, 5).map((e, i) => `
${i + 1}. Pergunta: "${e.question_asked}"
   Esperado: "${e.expected_answer}"
   Obtido: "${e.actual_answer || 'Sem resposta'}"
   Suggestions: ${JSON.stringify(e.improvement_suggestions || [])}
`).join('\n')}
`
  )
  .join('\n')}

TAREFA:
Analise o system prompt atual e sugira melhorias específicas. Foque em:
1. Instruções comportamentais faltantes
2. Diretrizes de formatação
3. Priorização de informações
4. Exemplos de raciocínio (few-shot)

Retorne APENAS um JSON válido neste formato:
{
  "current_prompt_analysis": "Análise crítica do prompt atual",
  "summary": "Resumo executivo das melhorias sugeridas",
  "recommendations": [
    {
      "type": "addition|modification|removal",
      "priority": "critical|high|medium|low",
      "category": "Categoria afetada",
      "issue": "Problema identificado",
      "suggested_addition": "Texto sugerido para adicionar/modificar",
      "rationale": "Por que essa mudança resolve as falhas",
      "evidence": [
        {
          "test_case_question": "Pergunta",
          "expected_answer": "Esperado",
          "actual_answer": "Obtido",
          "scores": {"similarity": 0, "factual": 0, "relevance": 0}
        }
      ]
    }
  ]
}`;
      }

      // Call Lovable AI
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`[generate-improvement-report] AI API error: ${aiResponse.status} ${errorText}`);
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content from AI');
      }

      // Parse JSON from AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[generate-improvement-report] Invalid JSON from AI:', content);
        throw new Error('Invalid JSON format from AI');
      }

      const reportData = JSON.parse(jsonMatch[0]);

      // Insert report into database
      const { data: insertedReport, error: insertError } = await supabase
        .from('improvement_reports')
        .insert({
          workspace_id,
          agent_id,
          report_type,
          analysis_period_start: periodStart.toISOString(),
          analysis_period_end: new Date().toISOString(),
          failed_executions_analyzed: executions.length,
          min_score_threshold,
          summary: reportData.summary,
          recommendations: reportData.recommendations,
          full_report: reportData,
          review_status: 'pending_review',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[generate-improvement-report] Insert error:', insertError);
        throw new Error(`Failed to save report: ${insertError.message}`);
      }

      generatedReports.push(insertedReport);
      console.log(`[generate-improvement-report] Report ${insertedReport.id} saved successfully`);
    }

    return new Response(
      JSON.stringify({
        message: `${generatedReports.length} relatório(s) gerado(s) com sucesso`,
        reports: generatedReports,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[generate-improvement-report] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
