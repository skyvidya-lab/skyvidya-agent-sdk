import { useState, useEffect, useMemo } from "react";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { AgentSelector } from "./AgentSelector";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { ConversationSearchInput } from "./ConversationSearchInput";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";
import { useTenantRouter } from "@/hooks/useTenantRouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PlusCircle, PanelLeftClose, ChevronRight, AlertTriangle, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
interface ChatInterfaceProps {
  tenantId?: string;
}
export function ChatInterface({
  tenantId: propTenantId
}: ChatInterfaceProps = {}) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [agentInfoOpen, setAgentInfoOpen] = useState(true);
  const [newMessageInput, setNewMessageInput] = useState("");
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const {
    tenant
  } = useTenantRouter();

  // Prioriza prop > tenant do router
  const effectiveTenantId = propTenantId || tenant?.id;

  // Buscar tenant completo se apenas tenantId foi fornecido (rotas administrativas)
  const {
    data: fetchedTenant
  } = useQuery({
    queryKey: ["tenant-for-chat", effectiveTenantId],
    queryFn: async () => {
      if (!effectiveTenantId) return null;
      const {
        data,
        error
      } = await supabase.from("tenants").select("*, tenant_config(*)").eq("id", effectiveTenantId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveTenantId && !tenant
  });

  // Usar tenant do router OU o buscado
  const effectiveTenant = tenant || fetchedTenant;
  const config = effectiveTenant?.tenant_config;

  // Fetch workspace agents (only enabled agents)
  const {
    data: workspaceAgents,
    isLoading: isLoadingAgents
  } = useWorkspaceAgents(effectiveTenantId);

  // Debug logging temporário
  useEffect(() => {
    console.log('[ChatInterface] Debug:', {
      propTenantId,
      tenantFromRouter: tenant?.id,
      effectiveTenantId,
      workspaceAgentsCount: workspaceAgents?.length,
      workspaceAgents,
      hasConfig: !!config,
      isLoadingAgents
    });
  }, [propTenantId, tenant, effectiveTenantId, workspaceAgents, config, isLoadingAgents]);
  const {
    conversations,
    createConversation
  } = useConversations(selectedAgentId);
  const {
    messages,
    isSending,
    sendMessage,
    isLoading
  } = useChat(selectedConversationId);

  // Persist sidebar state in localStorage (desktop only)
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem('chat-sidebar-open');
      if (saved !== null) {
        setIsSidebarOpen(saved === 'true');
      }
    }
  }, [isMobile]);
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('chat-sidebar-open', String(isSidebarOpen));
    }
  }, [isSidebarOpen, isMobile]);

  // Filtrar conversas pela busca
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => conv.title?.toLowerCase().includes(query) || conv.last_message_preview?.toLowerCase().includes(query));
  }, [conversations, searchQuery]);
  const selectedAgent = workspaceAgents?.find(wa => wa.agent.id === selectedAgentId)?.agent;
  const handleNewConversation = async () => {
    if (!selectedAgentId) return;
    const newConv = await createConversation({
      agentId: selectedAgentId
    });
    setSelectedConversationId(newConv.id);
  };
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedAgentId || !selectedConversationId) return;
    await sendMessage(content, selectedAgentId);
  };
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    if (isMobile) setIsSidebarOpen(false);
  };
  const handleStartNewChat = async () => {
    if (!selectedAgentId || !newMessageInput.trim()) return;
    const newConv = await createConversation({
      agentId: selectedAgentId
    });
    setSelectedConversationId(newConv.id);

    // Enviar primeira mensagem
    await sendMessage(newMessageInput, selectedAgentId);
    setNewMessageInput("");
  };
  const SidebarContent = () => <>
      <div className="p-4 border-b space-y-3">
        <Button onClick={handleNewConversation} disabled={!selectedAgentId} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Chat
        </Button>

        {/* Busca */}
        <ConversationSearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Informações do Agente */}
      <Collapsible open={agentInfoOpen} onOpenChange={setAgentInfoOpen}>
        
        
      </Collapsible>

      {/* Seletor de Agente */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <Label className="text-xs text-muted-foreground mb-2 block">Agente Ativo</Label>
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger>
            <SelectValue placeholder={isLoadingAgents ? "Carregando agentes..." : !workspaceAgents || workspaceAgents.length === 0 ? "Nenhum agente habilitado" : "Selecione um agente"} />
          </SelectTrigger>
          <SelectContent>
            {isLoadingAgents ? <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem> : !workspaceAgents || workspaceAgents.length === 0 ? <SelectItem value="empty" disabled>
                Nenhum agente habilitado neste workspace
              </SelectItem> : workspaceAgents.map(wa => <SelectItem key={wa.agent.id} value={wa.agent.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{wa.agent.platform}</Badge>
                    {wa.agent.name}
                  </div>
                </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Conversas */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.length === 0 && searchQuery && <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma conversa encontrada
            </p>}
          {filteredConversations.map(conv => <button key={conv.id} onClick={() => handleSelectConversation(conv.id)} className={cn("w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors", selectedConversationId === conv.id && "bg-muted")}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{conv.emoji_icon || '💬'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {conv.title || "Nova conversa"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.last_message_preview || "Sem mensagens"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(conv.updated_at), "d MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            </button>)}
        </div>
      </ScrollArea>
    </>;
  return <div className="flex h-full max-h-full overflow-hidden">
      {/* Sidebar Desktop - Colapsável */}
      <div className={cn("hidden md:flex border-r bg-card flex-col h-full overflow-hidden transition-all duration-300", isSidebarOpen ? "w-80" : "w-0")}>
        {isSidebarOpen && <SidebarContent />}
      </div>

      {/* Sidebar Mobile - Sheet */}
      <Sheet open={isSidebarOpen && isMobile} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Conversas</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-5rem)] overflow-hidden">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header com botão toggle */}
        <div className="border-b p-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="shrink-0">
            <PanelLeftClose className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
          </Button>
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>

        {selectedConversationId ? <>
            <MessageList messages={messages} isLoading={isSending} />
            <div className="border-t">
              <ChatInput onSend={handleSendMessage} disabled={isSending} placeholder={config?.chat_placeholder || "Digite sua mensagem..."} enableFileUpload={config?.enable_file_upload || false} />
              {/* Disclaimer */}
              <div className="px-4 py-2 bg-muted/30 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  O assistente pode cometer erros. Considere verificar informações importantes.
                </p>
              </div>
            </div>
          </> : <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
            <div className="text-center space-y-8 max-w-3xl p-8">
              {/* Logo Grande */}
              {config?.logo_url && <img src={config.logo_url} alt="Logo" className="h-24 mx-auto mb-6 object-contain animate-fade-in" />}
              
              {/* Título e Subtítulo */}
              <div className="space-y-3 animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {effectiveTenant?.name}
                </h1>
                
              </div>
              
              {/* Heading Principal */}
              <div className="space-y-4 mt-12 animate-fade-in">
                <h2 className="text-4xl md:text-5xl font-bold">
                  Como posso ajudar você hoje?
                </h2>
                <p className="text-lg text-muted-foreground">Faça perguntas sobre nossos serviços{config?.hero_subtitle || "o sistema"}
                </p>
              </div>
              
              {/* Input Grande para Nova Conversa */}
              {selectedAgentId && <div className="mt-12 max-w-3xl mx-auto animate-scale-in">
                  <div className="relative">
                    <Input placeholder={config?.chat_placeholder || "Digite sua mensagem..."} className="h-14 text-lg pr-14 shadow-lg" value={newMessageInput} onChange={e => setNewMessageInput(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && newMessageInput.trim()) {
                  e.preventDefault();
                  handleStartNewChat();
                }
              }} />
                    <Button size="icon" className="absolute right-2 top-2 h-10 w-10" onClick={handleStartNewChat} disabled={!newMessageInput.trim()}>
                      <SendHorizontal className="h-5 w-5" />
                    </Button>
                  </div>
                </div>}
              
              {!selectedAgentId && <p className="text-sm text-muted-foreground mt-8">
                  Selecione um agente na barra lateral para começar
                </p>}
              
              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground mt-8 flex items-center justify-center gap-2 opacity-70">
                <AlertTriangle className="h-3 w-3" />
                O assistente pode cometer erros. Considere verificar informações importantes.
              </p>
            </div>
          </div>}
      </div>
    </div>;
}