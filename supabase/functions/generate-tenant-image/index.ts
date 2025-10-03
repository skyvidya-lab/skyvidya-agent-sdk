import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry function with exponential backoff
async function retryWithBackoff(
  fn: () => Promise<Response>,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      const response = await fn();
      
      if (response.ok) {
        console.log(`Success on attempt ${attempt}`);
        return response;
      }
      
      if (response.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`Rate limit hit, retrying after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Return response for other errors or last attempt
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) throw error;
      const delay = 1000 * attempt;
      console.log(`Waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate tenant image function called - with Google Gemini API integration');
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

    // Use Google Gemini API for image generation (nano banana model)
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    // Use retry with backoff for API calls
    const aiResponse = await retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${geminiApiKey}`;
        const requestBody = {
          instances: [
            {
              prompt: prompt
            }
          ],
          parameters: {
            sampleCount: 1
          }
        };

        console.log('[DEBUG] Request URL:', apiUrl.replace(geminiApiKey, 'REDACTED'));
        console.log('[DEBUG] Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        console.log('[DEBUG] Response status:', response.status);
        console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers));

        clearTimeout(timeout);
        return response;
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[DEBUG] Raw error response:', errorText);
      console.error('Google Imagen API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit do Google atingido. Aguarde e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY inválida ou sem permissão.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Google Imagen API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('[IMAGEN] Full response:', JSON.stringify(aiData, null, 2));

    // Imagen API returns predictions array
    const predictions = aiData.predictions;
    
    if (!predictions || predictions.length === 0) {
      console.error('[IMAGEN] No predictions. Full response:', JSON.stringify(aiData));
      throw new Error('Nenhuma imagem retornada pela API');
    }

    // Extract base64 image from first prediction
    const base64Data = predictions[0].bytesBase64Encoded;
    if (!base64Data) {
      console.error('[IMAGEN] No base64 data in prediction:', JSON.stringify(predictions[0]));
      throw new Error('Nenhuma imagem gerada pela IA');
    }

    // Gemini returns raw base64, convert to buffer
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
