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
      console.log('[useChat] Starting message send:', { 
        conversationId, 
        agentId, 
        contentLength: content.length 
      });

      // Insert user message
      console.log('[useChat] Inserting user message...');
      const { data: userMessage, error: userError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content,
        })
        .select()
        .single();

      if (userError) {
        console.error('[useChat] Error inserting user message:', userError);
        throw userError;
      }
      
      console.log('[useChat] User message inserted successfully:', userMessage);

      // Optimistically update UI
      queryClient.setQueryData(
        ["messages", conversationId],
        (old: Message[] = []) => [...old, userMessage]
      );

      // Call agent
      console.log('[useChat] Calling agent edge function...', { agentId });
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

      if (agentError) {
        console.error('[useChat] Agent edge function error:', agentError);
        throw agentError;
      }
      if (agentResponse.error) {
        console.error('[useChat] Agent response error:', agentResponse.error);
        throw new Error(agentResponse.error);
      }
      
      console.log('[useChat] Agent response received:', { 
        messageLength: agentResponse.message?.length,
        hasMetadata: !!agentResponse.metadata 
      });

      const latency = Date.now() - startTime;

      // Insert assistant message
      console.log('[useChat] Inserting assistant message...');
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

      if (assistantError) {
        console.error('[useChat] Error inserting assistant message:', assistantError);
        throw assistantError;
      }
      
      console.log('[useChat] Assistant message inserted successfully:', assistantMessage);

      // Update conversation timestamp
      console.log('[useChat] Updating conversation timestamp...');
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Refresh messages
      console.log('[useChat] Refreshing queries...');
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      console.log('[useChat] Message send complete!');
      return assistantMessage;
    } catch (error) {
      console.error("[useChat] Error sending message:", error);
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
