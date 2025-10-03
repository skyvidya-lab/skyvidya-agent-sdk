import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateInsightsRequest {
  workspace_id: string;
  agent_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate cognitive insights function called - with Lovable AI integration');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('DIFY_API_KEY_SKYVIDYA');

    if (!lovableApiKey) {
      throw new Error('DIFY_API_KEY_SKYVIDYA not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { workspace_id, agent_id }: GenerateInsightsRequest = await req.json();

    console.log('Generating insights for agent:', agent_id);

    // Buscar últimas 50 execuções do agente
    const { data: executions, error: execError } = await supabase
      .from('test_executions')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('agent_id', agent_id)
      .order('executed_at', { ascending: false })
      .limit(50);

    if (execError) throw execError;

    if (!executions || executions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No executions found for this agent' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar dados para análise
    const executionSummary = executions.map(e => ({
      question: e.question_asked,
      expected: e.expected_answer,
      actual: e.actual_answer,
      similarity: e.similarity_score,
      accuracy: e.factual_accuracy,
      status: e.status,
      gaps: e.cognitive_gaps,
    }));

    const analysisPrompt = `Analise estas execuções de teste de um agente de IA:

${JSON.stringify(executionSummary, null, 2)}

Identifique e retorne um array JSON de insights estruturados:
[
  {
    "insight_type": "gap | pattern | recommendation",
    "severity": "critical | high | medium | low",
    "title": "<título curto do insight>",
    "description": "<descrição detalhada>",
    "evidence": { "examples": ["exemplo1", "exemplo2"] },
    "recommendations": ["recomendação1", "recomendação2"]
  }
]

Foque em:
1. GAPS CRÍTICOS: conceitos que o agente não domina
2. PADRÕES: erros recorrentes ou comportamentos
3. RECOMENDAÇÕES: melhorias específicas para o prompt ou configuração

Seja específico e acionável.`;

    const systemContent = 'Você é um analista especialista em IA que identifica padrões e gera insights acionáveis.';
    
    console.log('[generate-cognitive-insights] Using Lovable AI Gateway');
    console.log('[generate-cognitive-insights] Model: google/gemini-2.5-flash (FREE)');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI Gateway error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        throw new Error('Rate limit atingido. Aguarde alguns segundos e tente novamente.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Créditos esgotados. Adicione fundos ao workspace Lovable.');
      }
      throw new Error(`Lovable AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    console.log('[generate-cognitive-insights] Raw AI response length:', aiContent?.length);
    console.log('[generate-cognitive-insights] Response preview:', aiContent?.substring(0, 200));

    if (!aiContent) {
      throw new Error('No content received from Gemini API');
    }

    // Parse JSON response directly (Gemini returns valid JSON with responseMimeType)
    let insights;
    try {
      insights = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('[generate-cognitive-insights] Failed to parse JSON:', aiContent);
      console.error('Parse error:', parseError);
      throw new Error('Invalid JSON from AI: ' + (parseError as Error).message);
    }

    // Validate structure
    if (!Array.isArray(insights)) {
      console.error('[generate-cognitive-insights] Invalid structure - not an array:', insights);
      throw new Error('Invalid insights structure: expected array');
    }

    // Inserir insights no banco
    const insightsToInsert = insights.map((insight: any) => ({
      workspace_id,
      agent_id,
      insight_type: insight.insight_type,
      severity: insight.severity,
      title: insight.title,
      description: insight.description,
      evidence: insight.evidence || {},
      recommendations: insight.recommendations || [],
    }));

    const { error: insertError } = await supabase
      .from('cognitive_insights')
      .insert(insightsToInsert);

    if (insertError) {
      console.error('Error inserting insights:', insertError);
      throw insertError;
    }

    console.log(`Generated ${insights.length} insights for agent ${agent_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights_generated: insights.length,
        insights,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-cognitive-insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
