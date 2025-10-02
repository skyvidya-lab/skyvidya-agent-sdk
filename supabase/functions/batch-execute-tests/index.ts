import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchExecutionRequest {
  workspace_id: string;
  agent_ids: string[];
  test_case_ids: string[];
  concurrency?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { workspace_id, agent_ids, test_case_ids, concurrency = 3 }: BatchExecutionRequest = await req.json();

    console.log(`Starting batch execution: ${agent_ids.length} agents x ${test_case_ids.length} tests`);

    const executionPromises: Promise<any>[] = [];
    const results = { success: 0, failed: 0, errors: [] as string[] };

    // Execute tests in batches with concurrency control
    for (let i = 0; i < test_case_ids.length; i += concurrency) {
      const batch = test_case_ids.slice(i, i + concurrency);
      
      const batchPromises = batch.flatMap(test_case_id =>
        agent_ids.map(async (agent_id) => {
          try {
            const { error } = await supabase.functions.invoke('execute-test', {
              body: {
                test_case_id,
                agent_id,
                workspace_id,
              },
            });

            if (error) {
              console.error(`Error executing test ${test_case_id} for agent ${agent_id}:`, error);
              results.failed++;
              results.errors.push(`Test ${test_case_id} / Agent ${agent_id}: ${error.message}`);
            } else {
              results.success++;
            }
          } catch (err) {
            console.error(`Exception executing test ${test_case_id} for agent ${agent_id}:`, err);
            results.failed++;
            const errorMsg = err instanceof Error ? err.message : String(err);
            results.errors.push(`Test ${test_case_id} / Agent ${agent_id}: ${errorMsg}`);
          }
        })
      );

      await Promise.allSettled(batchPromises);
    }

    console.log(`Batch execution completed: ${results.success} success, ${results.failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        message: `Executados ${results.success} testes com sucesso, ${results.failed} falharam`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch execution error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
