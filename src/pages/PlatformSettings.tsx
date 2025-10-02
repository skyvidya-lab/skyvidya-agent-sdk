import { AppLayout } from "@/components/layout/AppLayout";
import { PlatformImageGenerator } from "@/components/platform/PlatformImageGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export default function PlatformSettings() {
  const handleLogoGenerated = (url: string) => {
    console.log('Platform logo generated:', url);
    toast.success('Logo da plataforma gerado! URL: ' + url);
    // Aqui você pode salvar a URL no banco ou aplicar diretamente
  };

  const handleBackgroundGenerated = (url: string) => {
    console.log('Platform background generated:', url);
    toast.success('Background da plataforma gerado! URL: ' + url);
    // Aqui você pode salvar a URL no banco ou aplicar diretamente
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações da Plataforma
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie a identidade visual e configurações do Skyvidya Agent SDK
          </p>
        </div>

        <div className="space-y-6">
          <PlatformImageGenerator
            onLogoGenerated={handleLogoGenerated}
            onBackgroundGenerated={handleBackgroundGenerated}
          />

          <Card>
            <CardHeader>
              <CardTitle>Outras Configurações</CardTitle>
              <CardDescription>
                Configurações adicionais da plataforma virão aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
