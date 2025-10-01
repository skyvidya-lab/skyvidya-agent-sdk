import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  tokens_used?: number;
  latency_ms?: number;
}

export function useChat(conversationId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  const sendMessage = async (content: string, agentId: string) => {
    if (!conversationId) throw new Error("No conversation selected");

    setIsSending(true);
    const startTime = Date.now();

    try {
      // Insert user message
      const { data: userMessage, error: userError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Optimistically update UI
      queryClient.setQueryData(
        ["messages", conversationId],
        (old: Message[] = []) => [...old, userMessage]
      );

      // Call agent
      const { data: agentResponse, error: agentError } = await supabase.functions.invoke(
        "call-agent",
        {
          body: {
            agent_id: agentId,
            message: content,
            conversation_id: conversationId,
          },
        }
      );

      if (agentError) throw agentError;
      if (agentResponse.error) throw new Error(agentResponse.error);

      const latency = Date.now() - startTime;

      // Insert assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: agentResponse.message,
          latency_ms: latency,
          metadata: agentResponse.metadata || {},
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      return assistantMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages: messages || [],
    isLoading,
    isSending,
    sendMessage,
  };
}
