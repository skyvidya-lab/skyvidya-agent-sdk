import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRef } from "react";
import type { ImageType } from "@/lib/imagePromptTemplates";

const COOLDOWN_MS = 3000; // 3 seconds cooldown

interface GenerateImageParams {
  prompt: string;
  imageType: ImageType;
  tenantId: string;
  context?: 'tenant' | 'platform';
}

interface GenerateImageResponse {
  url: string;
  imageType: ImageType;
  message: string;
}

export const useGenerateTenantImage = () => {
  const lastRequestTimeRef = useRef<number>(0);

  return useMutation({
    mutationFn: async ({ prompt, imageType, tenantId, context = 'tenant' }: GenerateImageParams): Promise<GenerateImageResponse> => {
      // Check cooldown
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTimeRef.current;
      
      if (timeSinceLastRequest < COOLDOWN_MS) {
        const waitTime = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
        throw new Error(`Aguarde ${waitTime} segundo${waitTime > 1 ? 's' : ''} antes de gerar novamente.`);
      }
      
      lastRequestTimeRef.current = now;

      const { data, error } = await supabase.functions.invoke('generate-tenant-image', {
        body: { prompt, imageType, tenantId, context }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Imagem gerada com sucesso!', { duration: 3000 });
    },
    onError: (error: Error) => {
      console.error('Error generating image:', error);
      if (error.message.includes('Aguarde')) {
        toast.error(error.message, { duration: 3000 });
      } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
        toast.error('Limite de geração atingido. Aguardando nova tentativa...', { duration: 5000 });
      } else if (error.message.includes('Créditos') || error.message.includes('402')) {
        toast.error('Créditos esgotados. Adicione créditos no workspace.', { duration: 5000 });
      } else if (error.message.includes('timeout')) {
        toast.error('Tempo esgotado. Tente novamente com um prompt mais simples.', { duration: 5000 });
      } else {
        toast.error('Erro ao processar. Tente novamente.', { duration: 5000 });
      }
    },
  });
};
