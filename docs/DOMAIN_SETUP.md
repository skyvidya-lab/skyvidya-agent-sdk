# Configuração de Domínio Customizado

Este guia explica como configurar um domínio customizado para seu tenant no SkyVidya.

## Visão Geral

Com domínios customizados, seu tenant pode ser acessado através de um endereço personalizado como:
- `chat.suaempresa.com.br`
- `atendimento.prefeitura.gov.br`
- `suporte.organizacao.org`

## Pré-requisitos

- Acesso administrativo ao tenant
- Acesso ao painel de controle DNS do seu domínio (ex: Registro.br, GoDaddy, Cloudflare, etc.)

## Passo a Passo

### 1. Adicionar Domínio no SkyVidya

1. Acesse o painel administrativo
2. Navegue até **Tenants** > **Seu Tenant** > **Domínios**
3. Clique em **"Adicionar Domínio Customizado"**
4. Digite o domínio desejado (ex: `chat.suaempresa.com.br`)
5. Clique em **"Adicionar Domínio"**

### 2. Configurar Registros DNS

Após adicionar o domínio, você verá as instruções de configuração DNS. Você precisará adicionar um registro TXT para verificação.

#### Registro TXT (Verificação)

**No painel DNS do seu provedor, adicione:**

```
Tipo: TXT
Host: _skyvidya-verification
Valor: skyvidya-verification=<token-fornecido>
TTL: 3600 (ou padrão do provedor)
```

**Exemplo prático:**

Se seu domínio é `chat.empresa.com.br`, o registro ficará assim:

- **Nome/Host**: `_skyvidya-verification.chat.empresa.com.br` ou apenas `_skyvidya-verification` (depende do provedor)
- **Valor**: O token completo mostrado na interface (ex: `skyvidya-verification=abc123...`)
- **TTL**: 3600 segundos (1 hora)

### 3. Aguardar Propagação DNS

A propagação DNS pode levar de alguns minutos até 48 horas, dependendo do provedor e das configurações de cache.

**Dicas:**
- A maioria das mudanças propaga em 15-30 minutos
- Você pode verificar a propagação em: https://dnschecker.org

### 4. Verificar Domínio

1. Após configurar o DNS, aguarde pelo menos 15 minutos
2. Volte ao painel de domínios no SkyVidya
3. Clique em **"Verificar"** ao lado do seu domínio
4. Se o registro DNS estiver correto, o domínio será marcado como verificado ✅

### 5. Acessar via Domínio Customizado

Após a verificação:
- Seu domínio estará ativo automaticamente
- O branding do tenant será aplicado automaticamente
- Usuários podem acessar diretamente via: `https://seu-dominio.com.br`

## Domínio Primário

Você pode ter múltiplos domínios configurados para o mesmo tenant. Para definir qual será o domínio primário (usado como padrão):

1. Localize o domínio na lista
2. Clique em **"Tornar Primário"**
3. O domínio primário será marcado com uma estrela ⭐

## Provedores DNS Populares

### Registro.br
1. Acesse: https://registro.br
2. Faça login e selecione seu domínio
3. Vá em "Editar Zona DNS"
4. Adicione o registro TXT conforme instruções

### Cloudflare
1. Acesse seu dashboard
2. Selecione o domínio
3. Vá em "DNS" > "Records"
4. Clique em "Add record"
5. Selecione tipo "TXT" e preencha os campos

### GoDaddy
1. Acesse "My Products"
2. Selecione "DNS" ao lado do seu domínio
3. Clique em "Add" na seção de registros
4. Selecione tipo "TXT" e configure

### Locaweb
1. Acesse o Painel de Controle
2. Selecione "Gerenciar" no domínio
3. Vá em "Editar Zona de DNS"
4. Adicione o registro TXT

## Troubleshooting

### "Registro TXT não encontrado"

**Possíveis causas:**
- DNS ainda não propagou (aguarde mais tempo)
- Registro configurado incorretamente
- Nome do host errado

**Soluções:**
1. Verifique se copiou o token completo
2. Confirme o nome do host: `_skyvidya-verification`
3. Aguarde mais 30 minutos e tente novamente
4. Use https://dnschecker.org para verificar

### "Domínio já está em uso"

Este domínio já está configurado em outro tenant. Entre em contato com o suporte.

### DNS propagou mas verificação falha

1. Limpe o cache DNS local:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   ```
2. Tente verificar novamente após 5 minutos

## SSL/HTTPS

O certificado SSL é gerenciado automaticamente:
- Emitido após a verificação do domínio
- Renovado automaticamente
- HTTPS é aplicado por padrão

## Suporte

Se você encontrar problemas:
1. Verifique se seguiu todos os passos corretamente
2. Aguarde pelo menos 1 hora após configurar o DNS
3. Entre em contato com o suporte técnico fornecendo:
   - Seu domínio
   - Captura de tela das configurações DNS
   - Mensagem de erro recebida
