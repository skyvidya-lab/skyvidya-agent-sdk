import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { domainId } = await req.json();

    if (!domainId) {
      throw new Error('Domain ID é obrigatório');
    }

    // Buscar informações do domínio
    const { data: domainData, error: fetchError } = await supabase
      .from('tenant_domains')
      .select('domain, verification_token')
      .eq('id', domainId)
      .single();

    if (fetchError || !domainData) {
      throw new Error('Domínio não encontrado');
    }

    console.log(`🔍 Verificando domínio: ${domainData.domain}`);

    // Verificar registro TXT no DNS usando Google DNS API
    const dnsQuery = `_skyvidya-verification.${domainData.domain}`;
    const dnsResponse = await fetch(
      `https://dns.google/resolve?name=${dnsQuery}&type=TXT`
    );
    
    if (!dnsResponse.ok) {
      throw new Error('Erro ao consultar DNS');
    }

    const dnsData = await dnsResponse.json();
    console.log('📋 DNS Response:', JSON.stringify(dnsData, null, 2));

    // Verificar se o registro TXT contém o token de verificação
    const hasValidTXT = dnsData.Answer?.some((record: any) => {
      const txtValue = record.data?.replace(/"/g, '');
      return txtValue?.includes(`skyvidya-verification=${domainData.verification_token}`);
    });

    if (hasValidTXT) {
      // Marcar domínio como verificado
      const { error: updateError } = await supabase
        .from('tenant_domains')
        .update({ 
          verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('id', domainId);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Domínio ${domainData.domain} verificado com sucesso!`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Domínio verificado com sucesso!' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`❌ Registro TXT não encontrado para ${domainData.domain}`);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Registro TXT de verificação não encontrado. Verifique se você configurou o DNS corretamente e aguarde a propagação.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar domínio';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
