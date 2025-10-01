import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentChatParams {
  agentId: string;
  message: string;
  conversationId?: string;
}

interface AgentChatResponse {
  platform: string;
  message: string;
  conversation_id?: string;
  metadata?: any;
}

export function useAgentChat() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ agentId, message, conversationId }: AgentChatParams): Promise<AgentChatResponse> => {
      const { data, error } = await supabase.functions.invoke('call-agent', {
        body: {
          agent_id: agentId,
          message,
          conversation_id: conversationId,
        }
      });

      if (error) {
        console.error('Error calling agent:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onError: (error: Error) => {
      console.error('Agent chat error:', error);
      toast({
        title: "Erro ao chamar agente",
        description: error.message || "Não foi possível conectar com o agente externo",
        variant: "destructive",
      });
    },
  });
}
