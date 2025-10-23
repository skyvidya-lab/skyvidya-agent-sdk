import { useState, useEffect } from "react";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { AgentSelector } from "./AgentSelector";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";
import { useTenantRouter } from "@/hooks/useTenantRouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlusCircle, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInterface() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const { tenant } = useTenantRouter();
  const config = tenant?.tenant_config;

  const { conversations, createConversation } = useConversations(selectedAgentId);
  const { messages, isSending, sendMessage, isLoading } = useChat(selectedConversationId);

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

  const handleNewConversation = async () => {
    if (!selectedAgentId) return;
    const newConv = await createConversation({ agentId: selectedAgentId });
    setSelectedConversationId(newConv.id);
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedAgentId || !selectedConversationId) return;
    // TODO: Handle attachments when storage is set up
    await sendMessage(content, selectedAgentId);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-full max-h-full overflow-hidden">
      {/* Sidebar Desktop - Colapsável */}
      <div className={cn(
        "hidden md:flex border-r bg-card flex-col h-full overflow-hidden transition-all duration-300",
        isSidebarOpen ? "w-80" : "w-0"
      )}>
        {isSidebarOpen && (
          <>
            <div className="p-4 border-b space-y-3">
              <h2 className="text-lg font-semibold">Conversas</h2>
              <AgentSelector
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
              />
              <Button
                onClick={handleNewConversation}
                disabled={!selectedAgentId}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Conversa
              </Button>
            </div>
            <ConversationList
              conversations={conversations || []}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
            />
          </>
        )}
      </div>

      {/* Sidebar Mobile - Sheet */}
      <Sheet open={isSidebarOpen && isMobile} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Conversas</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-5rem)] overflow-hidden">
            <div className="p-4 border-b space-y-3">
              <AgentSelector
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
              />
              <Button
                onClick={handleNewConversation}
                disabled={!selectedAgentId}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Conversa
              </Button>
            </div>
            <ConversationList
              conversations={conversations || []}
              selectedId={selectedConversationId}
              onSelect={handleSelectConversation}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header com botão toggle */}
        <div className="border-b p-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="shrink-0"
          >
            <PanelLeftClose className={cn(
              "h-5 w-5 transition-transform",
              !isSidebarOpen && "rotate-180"
            )} />
          </Button>
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>

        {selectedConversationId ? (
          <>
            <MessageList messages={messages} isLoading={isSending} />
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={isSending}
              placeholder={config?.chat_placeholder || "Digite sua mensagem..."}
              enableFileUpload={config?.enable_file_upload || false}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md p-8">
              {config?.logo_url && (
                <img 
                  src={config.logo_url} 
                  alt="Logo" 
                  className="h-16 mx-auto mb-4 object-contain"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {config?.welcome_message?.title || config?.hero_title || "Bem-vindo"}
                </h2>
                <p className="text-muted-foreground">
                  {config?.welcome_message?.subtitle || config?.hero_subtitle || "Selecione um agente e inicie uma conversa"}
                </p>
              </div>
              {selectedAgentId && (
                <Button onClick={handleNewConversation} size="lg" className="mt-4">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Iniciar Nova Conversa
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
