import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestConnectionParams {
  platform: string;
  api_endpoint: string;
  api_key_reference: string;
  platform_agent_id: string;
}

interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency_ms: number;
  platform_response?: any;
}

export function useTestAgentConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: TestConnectionParams): Promise<TestConnectionResponse> => {
      console.log('Testing connection with config:', config);
      
      const { data, error } = await supabase.functions.invoke('call-agent', {
        body: {
          test_mode: true,
          ...config
        }
      });

      if (error) {
        console.error('Connection test error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Conexão bem-sucedida!",
        description: `Latência: ${data.latency_ms}ms`,
      });
    },
    onError: (error: Error) => {
      console.error('Connection test failed:', error);
      
      // Map common errors to friendly messages
      let errorMessage = error.message;
      
      if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = "API Key inválida ou sem permissão";
      } else if (error.message.includes('404')) {
        errorMessage = "Agent ID não encontrado na plataforma";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Tempo limite excedido - verifique o endpoint";
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = "URL inválida ou plataforma fora do ar";
      } else if (error.message.includes('not found') || error.message.includes('not configured')) {
        errorMessage = "Configure o secret no Lovable Cloud primeiro";
      }
      
      toast({
        title: "❌ Falha na conexão",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
}
