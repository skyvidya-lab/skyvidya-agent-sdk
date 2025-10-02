import { useState } from "react";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageGeneratorDialog } from "@/components/tenants/ImageGeneratorDialog";
import type { ImageType } from "@/lib/imagePromptTemplates";

interface PlatformImageGeneratorProps {
  onLogoGenerated?: (url: string) => void;
  onBackgroundGenerated?: (url: string) => void;
}

export function PlatformImageGenerator({
  onLogoGenerated,
  onBackgroundGenerated,
}: PlatformImageGeneratorProps) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<ImageType>('logo');

  const handleOpenDialog = (type: ImageType) => {
    setCurrentImageType(type);
    setAiDialogOpen(true);
  };

  const handleImageGenerated = (url: string) => {
    if (currentImageType === 'logo' && onLogoGenerated) {
      onLogoGenerated(url);
    } else if (currentImageType === 'background' && onBackgroundGenerated) {
      onBackgroundGenerated(url);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Identidade Visual da Plataforma
          </CardTitle>
          <CardDescription>
            Gere logo, backgrounds e outros elementos visuais usando IA (GRATUITO até 6/out/2025)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => handleOpenDialog('logo')}
            >
              <Sparkles className="h-8 w-8 text-primary" />
              <div className="text-center">
                <div className="font-semibold">Gerar Logo</div>
                <div className="text-xs text-muted-foreground">Skyvidya Agent SDK</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => handleOpenDialog('background')}
            >
              <Sparkles className="h-8 w-8 text-primary" />
              <div className="text-center">
                <div className="font-semibold">Gerar Background</div>
                <div className="text-xs text-muted-foreground">Hero, Dashboard, etc</div>
              </div>
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Modelos Disponíveis:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Logo: AI Orchestration, Minimalista, Escudo, Hexágono</li>
              <li>Background: Hero, Dashboard, Circuito Digital, Fluxo de Dados</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ImageGeneratorDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        imageType={currentImageType}
        tenantId="platform"
        onImageGenerated={handleImageGenerated}
        isPlatformContext
      />
    </>
  );
}
