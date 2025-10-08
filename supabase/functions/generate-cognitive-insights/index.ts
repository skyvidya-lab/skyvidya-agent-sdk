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
    console.log('Generate cognitive insights function called - with Google Gemini API integration');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
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
    
    console.log('[generate-cognitive-insights] Using Google Gemini API');
    console.log('[generate-cognitive-insights] Model: gemini-2.5-pro');
    
    const fullPrompt = `${systemContent}\n\n${analysisPrompt}`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;
    const requestBody = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2000,
        responseMimeType: "application/json"
      }
    };

    console.log('[DEBUG] Request URL:', apiUrl.replace(geminiApiKey, 'REDACTED'));
    console.log('[DEBUG] Request body:', JSON.stringify(requestBody, null, 2));
    
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[DEBUG] Response status:', aiResponse.status);
    console.log('[DEBUG] Response headers:', Object.fromEntries(aiResponse.headers));

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[DEBUG] Raw error response:', errorText);
      console.error('Google Gemini API error:', aiResponse.status, errorText);
      if (aiResponse.status === 403) {
        throw new Error('GOOGLE_GEMINI_API_KEY inválida ou sem permissão');
      }
      if (aiResponse.status === 429) {
        throw new Error('Rate limit do Google atingido. Aguarde e tente novamente.');
      }
      throw new Error(`Google Gemini API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('[GEMINI] Full response:', JSON.stringify(aiData, null, 2));
    console.log('[GEMINI] Candidates:', aiData.candidates);
    console.log('[GEMINI] First candidate:', aiData.candidates?.[0]);

    // Check for safety blocks
    if (aiData.candidates?.[0]?.finishReason === 'SAFETY') {
      console.error('[GEMINI] Blocked by safety:', aiData.candidates[0].safetyRatings);
      throw new Error('Conteúdo bloqueado por filtros de segurança da IA');
    }

    const aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      console.error('[GEMINI] No content. Full response:', JSON.stringify(aiData));
      throw new Error('Nenhum conteúdo retornado pela IA');
    }

    console.log('[generate-cognitive-insights] Raw AI response length:', aiContent?.length);
    console.log('[generate-cognitive-insights] Response preview:', aiContent?.substring(0, 200));

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
