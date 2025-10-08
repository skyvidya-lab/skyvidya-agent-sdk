import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to save structured logs
async function saveLog(
  supabase: any,
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, any>
) {
  try {
    await supabase.from('logs').insert({
      level,
      message,
      context,
      tenant_id: context.tenant_id,
      user_id: context.user_id,
    });
  } catch (error) {
    console.error('Failed to save log:', error);
  }
}

// Helper function to save agent call metrics
async function saveAgentCallMetrics(
  supabase: any,
  data: {
    tenant_id: string;
    agent_id: string;
    conversation_id?: string;
    user_id?: string;
    message_length: number;
    platform: string;
    status: 'success' | 'error' | 'timeout';
    response_time_ms?: number;
    tokens_used?: number;
    error_message?: string;
    error_code?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    await supabase.from('agent_calls').insert(data);
  } catch (error) {
    console.error('Failed to save agent call metrics:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { agent_id, message, conversation_id, test_mode, platform, api_endpoint, api_key_reference, platform_agent_id } = await req.json();
    
    // Test mode: validate connection without full agent flow
    if (test_mode) {
      console.log('Test mode enabled:', { platform, api_endpoint, platform_agent_id, api_key_reference });
      
      if (!platform || !api_endpoint || !api_key_reference || !platform_agent_id) {
        throw new Error('Test mode requires: platform, api_endpoint, api_key_reference, platform_agent_id');
      }

      const apiKey = Deno.env.get(api_key_reference);
      if (!apiKey) {
        console.error('API key not found:', api_key_reference);
        throw new Error(`API key ${api_key_reference} not configured in secrets`);
      }

      const testAgent = {
        platform,
        api_endpoint,
        platform_agent_id,
      };

      const startTime = Date.now();
      
      // Call platform with test message
      let response;
      switch (platform) {
        case 'dify':
          response = await callDifyAgent(testAgent, apiKey, 'Connection test', undefined);
          break;
        case 'crewai':
          response = await callCrewAIAgent(testAgent, apiKey, 'Connection test');
          break;
        case 'langflow':
          response = await callLangflowAgent(testAgent, apiKey, 'Connection test');
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      const latency_ms = Date.now() - startTime;

      console.log('Test successful:', { latency_ms, platform });

      return new Response(JSON.stringify({
        success: true,
        message: 'Conexão estabelecida com sucesso',
        latency_ms,
        platform_response: response
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!agent_id || !message) {
      throw new Error('agent_id and message are required');
    }

    const startTime = Date.now();
    console.log('Calling agent:', { agent_id, message_length: message.length, conversation_id });
    
    // Fetch agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .single();
    
    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      await saveLog(supabase, 'error', 'Agent not found', {
        agent_id,
        error: agentError?.message,
        tenant_id: null,
        user_id: null,
      });
      throw new Error('Agent not found');
    }

    console.log('Agent loaded:', { platform: agent.platform, api_endpoint: agent.api_endpoint });
    
    await saveLog(supabase, 'info', 'Agent call started', {
      tenant_id: agent.tenant_id,
      agent_id: agent.id,
      conversation_id,
      platform: agent.platform,
      message_length: message.length,
    });
    
    // Fetch API key from secrets
    if (!agent.api_key_reference) {
      throw new Error('API key reference not configured for this agent');
    }

    const apiKey = Deno.env.get(agent.api_key_reference);
    if (!apiKey) {
      console.error('API key not found:', agent.api_key_reference);
      throw new Error(`API key ${agent.api_key_reference} not configured in secrets`);
    }
    
    // Buscar external_session_id da conversa
    let externalSessionId = '';
    if (conversation_id) {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('external_session_id')
        .eq('id', conversation_id)
        .single();
      
      if (convError) {
        console.error('Error fetching conversation:', convError);
      } else {
        externalSessionId = conversation?.external_session_id || '';
      }
      
      console.log('External session ID:', externalSessionId || 'nova conversa');
    }
    
    // Route to platform-specific handler
    let response;
    switch (agent.platform) {
      case 'dify':
        try {
          response = await callDifyAgent(agent, apiKey, message, externalSessionId);
        } catch (error) {
          // Se a conversa do Dify não existe mais, resetar e tentar novamente
          if ((error as Error).message === 'CONVERSATION_NOT_FOUND' && externalSessionId) {
            console.log('Dify conversation expired, creating new session...');
            
            // Limpar external_session_id no banco
            if (conversation_id) {
              await supabase
                .from('conversations')
                .update({ external_session_id: null })
                .eq('id', conversation_id);
            }
            
            // Tentar novamente sem conversation_id (nova sessão)
            response = await callDifyAgent(agent, apiKey, message, '');
            externalSessionId = ''; // Marcar como nova sessão para salvar o novo ID
          } else {
            throw error; // Re-lançar outros erros
          }
        }
        break;
      case 'crewai':
        response = await callCrewAIAgent(agent, apiKey, message);
        break;
      case 'langflow':
        response = await callLangflowAgent(agent, apiKey, message);
        break;
      default:
        throw new Error(`Unsupported platform: ${agent.platform}`);
    }
    
    const responseTime = Date.now() - startTime;
    console.log('Agent response received:', { response_time_ms: responseTime });
    
    // Save metrics
    await saveAgentCallMetrics(supabase, {
      tenant_id: agent.tenant_id,
      agent_id: agent.id,
      conversation_id,
      message_length: message.length,
      platform: agent.platform,
      status: 'success',
      response_time_ms: responseTime,
      tokens_used: (response as any).metadata?.tokens_used,
      metadata: (response as any).metadata,
    });
    
    await saveLog(supabase, 'info', 'Agent call completed', {
      tenant_id: agent.tenant_id,
      agent_id: agent.id,
      conversation_id,
      platform: agent.platform,
      response_time_ms: responseTime,
      status: 'success',
    });
    
    // Se é a primeira mensagem com Dify, salvar external_session_id retornado
    if (agent.platform === 'dify' && conversation_id && !externalSessionId && (response as any).conversation_id) {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ external_session_id: (response as any).conversation_id })
        .eq('id', conversation_id);
      
      if (updateError) {
        console.error('Error updating external_session_id:', updateError);
      } else {
        console.log('External session ID saved:', (response as any).conversation_id);
      }
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error calling agent:', error);
    
    // Save error log and metrics if we have agent info
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Try to get agent_id from request if available
      const body = await req.clone().json().catch(() => ({}));
      
      if (body.agent_id && supabase) {
        const { data: agent } = await supabase
          .from('agents')
          .select('id, tenant_id, platform')
          .eq('id', body.agent_id)
          .single();
        
        if (agent) {
          await saveLog(supabase, 'error', 'Agent call failed', {
            tenant_id: agent.tenant_id,
            agent_id: agent.id,
            conversation_id: body.conversation_id,
            platform: agent.platform,
            error: errorMessage,
          });
          
          await saveAgentCallMetrics(supabase, {
            tenant_id: agent.tenant_id,
            agent_id: agent.id,
            conversation_id: body.conversation_id,
            message_length: body.message?.length || 0,
            platform: agent.platform,
            status: 'error',
            error_message: errorMessage,
            error_code: (error as any).code || 'UNKNOWN',
          });
        }
      }
    } catch (logError) {
      console.error('Failed to save error logs:', logError);
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Dify API Adapter
async function callDifyAgent(
  agent: any,
  apiKey: string,
  message: string,
  conversationId?: string
) {
  console.log('Calling Dify agent:', agent.api_endpoint);
  console.log('Using Dify conversation ID:', conversationId || 'empty (new conversation)');
  
  const response = await fetch(`${agent.api_endpoint}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: message,
      response_mode: 'blocking',
      conversation_id: conversationId || '',
      user: 'user-' + crypto.randomUUID().substring(0, 8),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[call-agent] Dify response status:', response.status);
    console.error('[call-agent] Dify error body:', errorText);
    console.error('[call-agent] Rate limit remaining:', response.headers.get('x-ratelimit-remaining'));
    console.error('[call-agent] Rate limit reset:', response.headers.get('x-ratelimit-reset'));
    
    // Parse error details
    try {
      const errorData = JSON.parse(errorText);
      console.error('[call-agent] Parsed error:', errorData);
      
      // Check for rate limit error
      if (errorData.message?.includes('rate limit')) {
        throw new Error('RATE_LIMIT: ' + errorData.message);
      }
    } catch (e) {
      // Continue if JSON parse fails
    }
    
    // Se for 404 (conversa não existe), lançar erro específico
    if (response.status === 404) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }
    
    throw new Error(`Dify API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    platform: 'dify',
    message: data.answer,
    conversation_id: data.conversation_id,
    metadata: {
      created_at: data.created_at,
      model: data.model,
    }
  };
}

// CrewAI API Adapter
async function callCrewAIAgent(
  agent: any,
  apiKey: string,
  message: string
) {
  console.log('Calling CrewAI agent:', agent.api_endpoint);
  
  const response = await fetch(`${agent.api_endpoint}/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: message,
      agent_id: agent.platform_agent_id,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('CrewAI API error:', response.status, errorText);
    throw new Error(`CrewAI API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    platform: 'crewai',
    message: data.output || data.result,
    metadata: data
  };
}

// Langflow API Adapter
async function callLangflowAgent(
  agent: any,
  apiKey: string,
  message: string
) {
  console.log('Calling Langflow agent:', agent.api_endpoint);
  
  const response = await fetch(`${agent.api_endpoint}/run/${agent.platform_agent_id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_value: message,
      output_type: 'chat',
      input_type: 'chat',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Langflow API error:', response.status, errorText);
    throw new Error(`Langflow API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    platform: 'langflow',
    message: data.outputs?.[0]?.outputs?.[0]?.results?.message?.text || data.result,
    metadata: data
  };
}
