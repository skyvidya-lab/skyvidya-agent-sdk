import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { AgentSelector } from "./AgentSelector";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function ChatInterface() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [selectedConversationId, setSelectedConversationId] = useState<string>();

  const { conversations, createConversation } = useConversations(selectedAgentId);
  const { messages, isSending, sendMessage } = useChat(selectedConversationId);

  const handleNewConversation = async () => {
    if (!selectedAgentId) return;
    const newConv = await createConversation({ agentId: selectedAgentId });
    setSelectedConversationId(newConv.id);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedAgentId || !selectedConversationId) return;
    await sendMessage(content, selectedAgentId);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
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
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            <MessageList messages={messages} />
            <ChatInput onSend={handleSendMessage} disabled={isSending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-lg">Selecione um agente e inicie uma conversa</p>
              <p className="text-sm">ou crie uma nova conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
