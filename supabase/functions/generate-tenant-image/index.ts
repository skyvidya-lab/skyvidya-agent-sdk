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
    console.log('Generate tenant image function called - with Lovable AI Gateway');
    const { prompt, imageType, tenantId, context = 'tenant' } = await req.json();
    
    if (!prompt || !imageType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, imageType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const identifier = context === 'platform' ? 'platform' : tenantId;
    if (!identifier) {
      return new Response(
        JSON.stringify({ error: 'Missing identifier (tenantId for tenant context or use platform context)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating ${imageType} for ${context} (${identifier}) with prompt:`, prompt);

    // Use Lovable AI Gateway
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[generate-tenant-image] Using Lovable AI Gateway');
    console.log('[generate-tenant-image] Model: google/gemini-2.5-flash-image-preview');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout
    
    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{
            role: 'user',
            content: prompt
          }],
          modalities: ['image', 'text']
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[DEBUG] Response status:', aiResponse.status);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('[DEBUG] Raw error response:', errorText);
        console.error('Lovable AI Gateway error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit atingido. Aguarde e tente novamente.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`Lovable AI Gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log('[LOVABLE_AI] Response structure received');

      // Extract image data from Lovable AI response
      const images = aiData.choices?.[0]?.message?.images;
      if (!images || images.length === 0) {
        console.error('[LOVABLE_AI] No images found in response');
        throw new Error('Nenhuma imagem gerada pela IA');
      }

      const imageUrl = images[0]?.image_url?.url;
      if (!imageUrl || !imageUrl.startsWith('data:image/')) {
        console.error('[LOVABLE_AI] Invalid image URL format');
        throw new Error('Formato de imagem inválido');
      }

      // Extract base64 data from data URL
      const base64Match = imageUrl.match(/^data:image\/\w+;base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Failed to extract base64 data from image URL');
      }
      const base64Data = base64Match[1];
      
      console.log('[LOVABLE_AI] Image extracted successfully');

      // Convert base64 to buffer
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Determine bucket based on image type and context
      const bucket = imageType === 'background' ? 'tenant-backgrounds' : 'tenant-logos';
      const fileName = `${identifier}-${imageType}-${Date.now()}.png`;

      console.log(`Uploading to bucket: ${bucket}, file: ${fileName}, context: ${context}`);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('Image uploaded successfully:', urlData.publicUrl);

      return new Response(
        JSON.stringify({ 
          url: urlData.publicUrl,
          imageType,
          message: 'Imagem gerada e salva com sucesso!'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }

  } catch (error) {
    console.error('Error in generate-tenant-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate or upload image'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
