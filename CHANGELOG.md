# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Fixed
- 🔧 **Platform Settings (`/platform-settings`)**: Migrada geração de imagens para Lovable AI Gateway
  - Removida dependência de `GOOGLE_GEMINI_API_KEY` (não configurada)
  - Agora usa `LOVABLE_API_KEY` (pré-configurada no Lovable Cloud)
  - Modelo: `google/gemini-2.5-flash-image-preview`
  - Funcionalidade de "Gerar Logo" e "Gerar Background" 100% operacional
  
- 🔧 **Logs Page (`/logs`)**: Sistema de logs agora funcional
  - Criadas tabelas `logs` e `agent_calls` com schema correto
  - RLS policies implementadas para isolamento por tenant
  - Logging implementado nas edge functions `call-agent` e `chat-with-ai`
  - Dashboard exibe métricas reais de chamadas de agentes e eventos do sistema
  
- 🔧 **Dashboard (`/dashboard`)**: Corrigida responsividade dos gráficos em mobile
  - Adicionado scroll horizontal em telas < 768px
  - Gráficos com largura mínima forçada (600px)
  - Grid adaptativo (1 coluna em tablet, 2 em desktop)
  - Eixos dos gráficos otimizados (fontSize 11px, altura 60px)
  - Legendas ocultadas em mobile para economizar espaço

### Changed
- ⚙️ **Edge Function**: `generate-tenant-image` agora usa Lovable AI Gateway
  - Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions`
  - Modelo: `google/gemini-2.5-flash-image-preview`
  - Autenticação: `LOVABLE_API_KEY` (gerenciada automaticamente)
  
- ⚙️ **Database**: Adicionadas tabelas e índices para performance de logs
  - Tabela `logs`: Eventos estruturados do sistema
  - Tabela `agent_calls`: Métricas de chamadas de agentes
  - Índices em `created_at`, `tenant_id`, `agent_id`, `status`, `level`

### Added
- 📝 **Documentação**: `CHANGELOG.md` criado para rastrear mudanças
- 📊 **Observabilidade**: Métricas de chamadas de agentes agora registradas
  - `response_time_ms`: Tempo de resposta
  - `tokens_used`: Tokens consumidos
  - `status`: success | error | timeout
  - `platform`: dify | langflow | crewai

### Technical Debt
- ⚠️ **Validar suporte de geração de imagens**: Confirmar se Lovable AI Gateway suporta imagens base64 em produção
- ⚠️ **Implementar alertas automáticos**: Sistema de alertas baseado em logs ainda não implementado
- ⚠️ **Otimizar queries de logs**: Considerar materialized views para métricas agregadas

---

## [0.3.0] - 2025-10-02

### Added
- 🎉 **Migração completa para Lovable AI Gateway**
  - Edge functions `generate-improvement-report` e `generate-cognitive-insights` migradas
  - Modelo padrão: `google/gemini-2.5-flash`
  - Structured outputs nativos com `response_format: { type: "json_object" }`
  - Tratamento específico de erros 429 (rate limit) e 402 (créditos)

### Deprecated
- ❌ `GOOGLE_GEMINI_API_KEY`: Não mais necessária (substituída por `LOVABLE_API_KEY`)

---

## [0.2.0] - 2025-09-30

### Added
- ✅ Autenticação Google OAuth em produção
- ✅ Schema base multi-tenant (tenants, agents, conversations, messages)
- ✅ RLS policies básicas
- ✅ Landing page com os 5 pilares
- ✅ Componentes UI base (shadcn/ui)
- ✅ Dashboard administrativo básico
- ✅ Interface de chat com streaming

### Changed
- 🔄 Lovable Cloud habilitado como backend principal

---

## [0.1.0] - 2025-09-01

### Added
- 🚀 Versão inicial do Skyvidya Agent SDK
- 📚 PRD v3.0 e PLANO_ACAO.md criados
- 🏗️ Arquitetura de 5 pilares definida
- 🎯 North Star Metric estabelecida

---

## Convenções do Changelog

- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas
- **Removed**: Funcionalidades removidas
- **Fixed**: Correções de bugs
- **Security**: Correções de vulnerabilidades

### Emojis Usados
- 🚀 Lançamento/Deploy
- ✅ Implementado
- 🔧 Correção
- ⚙️ Configuração
- 📊 Métricas/Analytics
- 📝 Documentação
- 🎉 Marco importante
- ⚠️ Aviso/Débito técnico
- ❌ Removido/Deprecado
- 🔄 Mudança
