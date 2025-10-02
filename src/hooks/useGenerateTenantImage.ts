import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ImageType } from "@/lib/imagePromptTemplates";

interface GenerateImageParams {
  prompt: string;
  imageType: ImageType;
  tenantId: string;
}

interface GenerateImageResponse {
  url: string;
  imageType: ImageType;
  message: string;
}

export const useGenerateTenantImage = () => {
  return useMutation({
    mutationFn: async ({ prompt, imageType, tenantId }: GenerateImageParams): Promise<GenerateImageResponse> => {
      const { data, error } = await supabase.functions.invoke('generate-tenant-image', {
        body: { prompt, imageType, tenantId }
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
      toast.success(data.message || 'Imagem gerada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error generating image:', error);
      if (error.message.includes('Rate limit')) {
        toast.error('Limite de requisições atingido. Aguarde alguns segundos.');
      } else if (error.message.includes('Créditos')) {
        toast.error('Créditos esgotados. Adicione mais créditos ao workspace.');
      } else {
        toast.error('Erro ao gerar imagem. Tente novamente.');
      }
    },
  });
};
