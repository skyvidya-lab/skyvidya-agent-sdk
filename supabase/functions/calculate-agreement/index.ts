import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgreementRequest {
  workspace_id: string;
  benchmark_id?: string;
  test_case_ids: string[];
  agent_ids: string[];
}

// Fleiss' Kappa calculation for multiple raters
function calculateFleissKappa(matrix: number[][]): number {
  const n = matrix.length; // number of subjects (test cases)
  const N = matrix[0].length; // number of categories
  const k = matrix[0].reduce((sum, val) => sum + val, 0); // number of raters per subject

  // Calculate P_i for each subject
  const P_i = matrix.map(row => {
    const sum = row.reduce((acc, n_ij) => acc + n_ij * n_ij, 0);
    return (sum - k) / (k * (k - 1));
  });

  // Calculate P_bar (mean of P_i)
  const P_bar = P_i.reduce((sum, p) => sum + p, 0) / n;

  // Calculate P_j for each category
  const P_j = [];
  for (let j = 0; j < N; j++) {
    const sum = matrix.reduce((acc, row) => acc + row[j], 0);
    P_j.push(sum / (n * k));
  }

  // Calculate P_e_bar
  const P_e_bar = P_j.reduce((acc, p_j) => acc + p_j * p_j, 0);

  // Calculate Kappa
  const kappa = (P_bar - P_e_bar) / (1 - P_e_bar);
  return kappa;
}

// Interpret Kappa score
function interpretKappa(kappa: number): string {
  if (kappa < 0) return 'poor';
  if (kappa < 0.2) return 'slight';
  if (kappa < 0.4) return 'fair';
  if (kappa < 0.6) return 'moderate';
  if (kappa < 0.8) return 'substantial';
  return 'almost_perfect';
}

// Categorize response quality
function categorizeResponse(similarity: number, factual: number, relevance: number): string {
  const avg = (similarity + factual + relevance) / 3;
  if (avg >= 85) return 'EXCELLENT';
  if (avg >= 70) return 'GOOD';
  if (avg >= 50) return 'FAIR';
  return 'POOR';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { workspace_id, benchmark_id, test_case_ids, agent_ids }: AgreementRequest = await req.json();

    console.log(`Calculating agreement for ${test_case_ids.length} tests and ${agent_ids.length} agents`);

    // Fetch all relevant executions
    const { data: executions, error: execError } = await supabase
      .from('test_executions')
      .select('*')
      .eq('workspace_id', workspace_id)
      .in('test_case_id', test_case_ids)
      .in('agent_id', agent_ids);

    if (execError) throw execError;

    const agreementResults = [];

    // Calculate agreement for each test case
    for (const test_case_id of test_case_ids) {
      const caseExecutions = executions.filter(e => e.test_case_id === test_case_id);
      
      if (caseExecutions.length < 2) {
        console.log(`Skipping test case ${test_case_id}: insufficient executions`);
        continue;
      }

      // Categorize each agent's response
      const categories = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
      const categorizedResponses = caseExecutions.map(exec => 
        categorizeResponse(
          exec.similarity_score || 0,
          exec.factual_accuracy || 0,
          exec.relevance_score || 0
        )
      );

      // Build matrix for Kappa calculation
      const matrix = [categories.map(cat => 
        categorizedResponses.filter(resp => resp === cat).length
      )];

      // Calculate Kappa
      const kappa = calculateFleissKappa(matrix);
      const interpretation = interpretKappa(kappa);

      // Determine consensus category
      const categoryCounts = categories.map(cat => ({
        category: cat,
        count: categorizedResponses.filter(r => r === cat).length
      }));
      const consensusCategory = categoryCounts.sort((a, b) => b.count - a.count)[0].category;

      // Determine disagreement level
      const uniqueCategories = new Set(categorizedResponses).size;
      let disagreementLevel = 'none';
      if (uniqueCategories === 1) disagreementLevel = 'none';
      else if (uniqueCategories === 2) disagreementLevel = 'low';
      else if (uniqueCategories === 3) disagreementLevel = 'medium';
      else disagreementLevel = 'high';

      // Require human review if kappa < 0.4 or high disagreement
      const requiresReview = kappa < 0.4 || disagreementLevel === 'high';

      // Store agreement analysis
      const { error: insertError } = await supabase
        .from('agreement_analysis')
        .insert({
          workspace_id,
          benchmark_id,
          test_case_id,
          agent_ids: caseExecutions.map(e => e.agent_id),
          kappa_score: Math.round(kappa * 1000) / 1000,
          interpretation,
          consensus_category: consensusCategory,
          disagreement_level: disagreementLevel,
          requires_human_review: requiresReview,
          evidence: {
            categorized_responses: categorizedResponses,
            category_counts: categoryCounts,
            execution_ids: caseExecutions.map(e => e.id)
          }
        });

      if (insertError) {
        console.error(`Error storing agreement for test ${test_case_id}:`, insertError);
      } else {
        agreementResults.push({
          test_case_id,
          kappa,
          interpretation,
          consensus_category: consensusCategory,
          disagreement_level: disagreementLevel,
          requires_review: requiresReview
        });
      }
    }

    console.log(`Agreement analysis completed for ${agreementResults.length} test cases`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results: agreementResults,
        summary: {
          total: agreementResults.length,
          requires_review: agreementResults.filter(r => r.requires_review).length,
          avg_kappa: agreementResults.reduce((sum, r) => sum + r.kappa, 0) / agreementResults.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Agreement calculation error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
