import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchExecutionRequest {
  batch_id: string;
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

    const { batch_id, workspace_id, agent_ids, test_case_ids, concurrency = 3 }: BatchExecutionRequest = await req.json();

    console.log(`Starting batch execution ${batch_id}: ${agent_ids.length} agents x ${test_case_ids.length} tests`);

    // Update batch status to running
    await supabase
      .from('batch_executions')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', batch_id);

    const totalTests = agent_ids.length * test_case_ids.length;
    let completedTests = 0;
    let successfulTests = 0;
    let failedTests = 0;
    const executionIds: string[] = [];
    const errorLog: any[] = [];
    const startTime = Date.now();

    // Execute tests in batches with concurrency control
    for (let i = 0; i < test_case_ids.length; i += concurrency) {
      const batch = test_case_ids.slice(i, i + concurrency);
      
      const batchPromises = batch.flatMap(test_case_id =>
        agent_ids.map(async (agent_id) => {
          try {
            // Fetch test case
            const { data: testCase, error: testError } = await supabase
              .from('test_cases')
              .select('*')
              .eq('id', test_case_id)
              .single();

            if (testError) throw new Error(`Test case not found: ${testError.message}`);

            // Fetch agent
            const { data: agent, error: agentError } = await supabase
              .from('agents')
              .select('*')
              .eq('id', agent_id)
              .single();

            if (agentError) throw new Error(`Agent not found: ${agentError.message}`);

            // Create initial execution record
            const { data: execution, error: execError } = await supabase
              .from('test_executions')
              .insert({
                workspace_id,
                test_case_id,
                agent_id,
                question_asked: testCase.question,
                expected_answer: testCase.expected_answer,
                status: 'pending'
              })
              .select()
              .single();

            if (execError) throw new Error(`Failed to create execution: ${execError.message}`);

            executionIds.push(execution.id);

            // Call agent
            const callStartTime = Date.now();
            const { data: agentResponse, error: callError } = await supabase.functions.invoke('call-agent', {
              body: {
                agent_id,
                message: testCase.question,
                workspace_id
              }
            });

            if (callError) throw new Error(`Agent call failed: ${callError.message}`);
            if (!agentResponse) throw new Error('Agent returned no response');

            const callLatencyMs = Date.now() - callStartTime;
            const actual_answer = agentResponse.message || agentResponse.answer || null;

            console.log('Agent response:', {
              test_case_id,
              agent_id,
              has_message: !!actual_answer,
              message_length: actual_answer?.length || 0,
              latency_ms: callLatencyMs
            });

            // Update execution with agent response
            await supabase
              .from('test_executions')
              .update({
                actual_answer: actual_answer,
                latency_ms: callLatencyMs,
                tokens_used: agentResponse.metadata?.tokens_used || null,
                cost_usd: agentResponse.metadata?.cost_usd || null
              })
              .eq('id', execution.id);

            // Validate response
            const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-agent-response', {
              body: {
                execution_id: execution.id,
                question: testCase.question,
                expected_answer: testCase.expected_answer,
                actual_answer: actual_answer || ''
              }
            });

            if (validationError) throw new Error(`Validation failed: ${validationError.message}`);

            successfulTests++;
            completedTests++;

            // Update batch progress
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const testsPerSecond = completedTests / elapsedSeconds;
            const remainingTests = totalTests - completedTests;
            const estimatedSecondsRemaining = remainingTests / testsPerSecond;
            const estimatedCompletion = new Date(Date.now() + estimatedSecondsRemaining * 1000).toISOString();

            await supabase
              .from('batch_executions')
              .update({
                completed_tests: completedTests,
                successful_tests: successfulTests,
                failed_tests: failedTests,
                execution_ids: executionIds,
                error_log: errorLog,
                estimated_completion: estimatedCompletion
              })
              .eq('id', batch_id);

          } catch (err) {
            console.error(`Exception executing test ${test_case_id} for agent ${agent_id}:`, err);
            failedTests++;
            completedTests++;
            
            const errorMsg = err instanceof Error ? err.message : String(err);
            errorLog.push({
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `Test ${test_case_id} / Agent ${agent_id}: ${errorMsg}`,
              test_case_id,
              agent_id
            });

            // Update batch progress with error
            await supabase
              .from('batch_executions')
              .update({
                completed_tests: completedTests,
                successful_tests: successfulTests,
                failed_tests: failedTests,
                execution_ids: executionIds,
                error_log: errorLog
              })
              .eq('id', batch_id);
          }
        })
      );

      await Promise.allSettled(batchPromises);
    }

    // Mark batch as completed
    await supabase
      .from('batch_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_tests: completedTests,
        successful_tests: successfulTests,
        failed_tests: failedTests,
        execution_ids: executionIds,
        error_log: errorLog
      })
      .eq('id', batch_id);

    console.log(`Batch execution ${batch_id} completed: ${successfulTests} success, ${failedTests} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        batch_id,
        results: {
          total: totalTests,
          completed: completedTests,
          successful: successfulTests,
          failed: failedTests
        },
        message: `Executados ${successfulTests} testes com sucesso, ${failedTests} falharam`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch execution error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to mark batch as failed if we have batch_id
    try {
      const body = await req.clone().json();
      if (body.batch_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('batch_executions')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: [{ 
              timestamp: new Date().toISOString(),
              level: 'error',
              message: errorMsg 
            }]
          })
          .eq('id', body.batch_id);
      }
    } catch (e) {
      console.error('Failed to update batch status:', e);
    }
    
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
