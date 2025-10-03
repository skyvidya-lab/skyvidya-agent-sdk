import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  execution_id: string;
  question: string;
  expected_answer: string;
  actual_answer: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { execution_id, question, expected_answer, actual_answer }: ValidationRequest = await req.json();

    console.log('Validating execution:', execution_id);

    // Chamar Lovable AI Gateway para validação
    const validationPrompt = `Você é um validador especialista em qualidade de respostas de IA.

PERGUNTA: ${question}

RESPOSTA ESPERADA: ${expected_answer}

RESPOSTA OBTIDA: ${actual_answer}

Analise as respostas e retorne APENAS um JSON válido com a seguinte estrutura (sem markdown, sem explicações adicionais):
{
  "similarity_score": <número de 0 a 100>,
  "factual_accuracy": <número de 0 a 100>,
  "relevance_score": <número de 0 a 100>,
  "justification": "<explicação detalhada da avaliação>",
  "cognitive_gaps": ["<gap1>", "<gap2>"],
  "improvement_suggestions": ["<sugestão1>", "<sugestão2>"]
}

Critérios de avaliação:
- similarity_score: quão similar semanticamente são as respostas
- factual_accuracy: se os fatos estão corretos
- relevance_score: se a resposta é relevante para a pergunta
- cognitive_gaps: conceitos ausentes ou mal explicados
- improvement_suggestions: como melhorar a resposta`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    const requestBody = {
      contents: [{
        parts: [{ text: validationPrompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
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

    // Parse JSON response from AI
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI response:', aiContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    const validation = JSON.parse(jsonMatch[0]);

    // Determinar status baseado nos scores
    let status = 'passed';
    const avgScore = (validation.similarity_score + validation.factual_accuracy + validation.relevance_score) / 3;
    
    if (avgScore < 70) {
      status = 'failed';
    } else if (avgScore < 85) {
      status = 'warning';
    }

    // Atualizar execução no banco
    const { error: updateError } = await supabase
      .from('test_executions')
      .update({
        similarity_score: validation.similarity_score,
        factual_accuracy: validation.factual_accuracy,
        relevance_score: validation.relevance_score,
        validation_justification: validation.justification,
        cognitive_gaps: validation.cognitive_gaps || [],
        improvement_suggestions: validation.improvement_suggestions || [],
        status,
      })
      .eq('id', execution_id);

    if (updateError) {
      console.error('Error updating execution:', updateError);
      throw updateError;
    }

    console.log('Validation completed successfully:', execution_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        validation,
        status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-agent-response:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
