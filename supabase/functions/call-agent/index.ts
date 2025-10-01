import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    console.log('Calling agent:', { agent_id, message_length: message.length, conversation_id });
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Fetch agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .single();
    
    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      throw new Error('Agent not found');
    }

    console.log('Agent loaded:', { platform: agent.platform, api_endpoint: agent.api_endpoint });
    
    // Fetch API key from secrets
    if (!agent.api_key_reference) {
      throw new Error('API key reference not configured for this agent');
    }

    const apiKey = Deno.env.get(agent.api_key_reference);
    if (!apiKey) {
      console.error('API key not found:', agent.api_key_reference);
      throw new Error(`API key ${agent.api_key_reference} not configured in secrets`);
    }
    
    // Route to platform-specific handler
    let response;
    switch (agent.platform) {
      case 'dify':
        response = await callDifyAgent(agent, apiKey, message, conversation_id);
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
    
    console.log('Agent response received');
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error calling agent:', error);
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
    console.error('Dify API error:', response.status, errorText);
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
