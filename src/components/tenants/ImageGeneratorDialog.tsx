import { useState } from "react";
import { Sparkles, RefreshCw, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGenerateTenantImage } from "@/hooks/useGenerateTenantImage";
import { getTemplatesByType, type ImageType, type PromptTemplate } from "@/lib/imagePromptTemplates";
import { toast } from "sonner";

interface ImageGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageType: ImageType;
  tenantId: string;
  onImageGenerated: (url: string) => void;
}

export function ImageGeneratorDialog({
  open,
  onOpenChange,
  imageType,
  tenantId,
  onImageGenerated,
}: ImageGeneratorDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const generateImage = useGenerateTenantImage();

  const templates = getTemplatesByType(imageType);

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Digite um prompt para gerar a imagem");
      return;
    }

    generateImage.mutate(
      { prompt, imageType, tenantId },
      {
        onSuccess: (data) => {
          setGeneratedImageUrl(data.url);
        },
      }
    );
  };

  const handleUseTemplate = (template: PromptTemplate) => {
    setPrompt(template.prompt);
  };

  const handleSave = () => {
    if (generatedImageUrl) {
      onImageGenerated(generatedImageUrl);
      onOpenChange(false);
      setPrompt("");
      setGeneratedImageUrl(null);
    }
  };

  const handleRegenerate = () => {
    setGeneratedImageUrl(null);
  };

  const imageTypeLabel = imageType === 'logo' ? 'Logo' : 
                         imageType === 'background' ? 'Background' : 'Favicon';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar {imageTypeLabel} com IA
          </DialogTitle>
          <DialogDescription>
            Use Gemini Nano Banana (GRATUITO até 6 de outubro de 2025) para criar sua identidade visual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Templates */}
          {templates.length > 0 && !generatedImageUrl && (
            <div>
              <Label>Templates Rápidos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="h-auto py-2 px-3 text-left justify-start"
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          {!generatedImageUrl && (
            <div>
              <Label htmlFor="prompt">Prompt Customizado</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Descreva o ${imageTypeLabel.toLowerCase()} que deseja gerar...`}
                className="min-h-[100px] mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Dica: Seja específico sobre cores, estilo, elementos visuais e atmosfera desejada.
              </p>
            </div>
          )}

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="space-y-4">
              <div className="relative rounded-lg border overflow-hidden bg-muted">
                <img
                  src={generatedImageUrl}
                  alt="Generated preview"
                  className={`w-full ${imageType === 'logo' ? 'h-64 object-contain' : 'h-96 object-cover'}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  disabled={generateImage.isPending}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar Novamente
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={generateImage.isPending}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Usar Esta Imagem
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!generatedImageUrl && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={generateImage.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateImage.isPending || !prompt.trim()}
              >
                {generateImage.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Imagem
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
