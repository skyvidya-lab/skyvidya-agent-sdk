-- Corrigir api_key_reference dos agentes para usar os secrets configurados

-- Agente aprovacao_projetos deve usar DIFY_API_KEY_APROVACAO_PROJETOS
UPDATE agents 
SET api_key_reference = 'DIFY_API_KEY_APROVACAO_PROJETOS'
WHERE name = 'aprovacao_projetos' OR platform_agent_id = 'chat-pd-uap-v1';

-- Agente pd_poa deve usar DIFY_API_KEY_PD_POA
UPDATE agents 
SET api_key_reference = 'DIFY_API_KEY_PD_POA'
WHERE name = 'pd_poa' OR platform_agent_id = 'chat-pd-poa-v1';

-- Garantir que skyvidya_agent_sdk use DIFY_API_KEY_SKYVIDYA (já está correto)
UPDATE agents 
SET api_key_reference = 'DIFY_API_KEY_SKYVIDYA'
WHERE name = 'skyvidya_agent_sdk' OR platform_agent_id = 'wzvKYnRyEolxwUxs';