-- Remove a constraint existente de difficulty
ALTER TABLE test_cases
DROP CONSTRAINT IF EXISTS test_cases_difficulty_check;

-- Adiciona nova constraint com todos os valores necessários
ALTER TABLE test_cases
ADD CONSTRAINT test_cases_difficulty_check
CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'high'::text, 'critical'::text]));