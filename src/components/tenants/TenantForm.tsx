import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Upload, X, Sparkles } from "lucide-react";
import { ImageGeneratorDialog } from "./ImageGeneratorDialog";
import type { ImageType } from "@/lib/imagePromptTemplates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTenant, useUpdateTenant } from "@/hooks/useTenants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fontes populares do Google Fonts
const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Lato",
  "Poppins",
  "Raleway",
  "Ubuntu",
  "Nunito",
  "Playfair Display",
];

const tenantSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres").max(50).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  domain: z.string().url("Domínio inválido").optional().or(z.literal("")),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").default("#000000"),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").default("#666666"),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").default("#0066CC"),
  font_family: z.string().default("Inter"),
  background_image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  hero_title: z.string().default("Como posso ajudar você hoje?"),
  hero_subtitle: z.string().default("Faça perguntas sobre nossos serviços"),
  chat_placeholder: z.string().default("Digite sua mensagem..."),
  welcome_message: z.object({
    title: z.string().default("Bem-vindo"),
    subtitle: z.string().default("Estamos aqui para ajudar"),
  }),
  enable_google_auth: z.boolean().default(true),
  enable_guest_access: z.boolean().default(false),
  enable_file_upload: z.boolean().default(false),
  enable_conversation_export: z.boolean().default(true),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: any;
}

export function TenantForm({ open, onOpenChange, tenant }: TenantFormProps) {
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(tenant?.logo_url || "");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<ImageType>('logo');

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: tenant?.name || "",
      slug: tenant?.slug || "",
      domain: tenant?.domain || "",
      logo_url: tenant?.logo_url || "",
      primary_color: tenant?.primary_color || "#000000",
      secondary_color: tenant?.tenant_config?.secondary_color || "#666666",
      accent_color: tenant?.tenant_config?.accent_color || "#0066CC",
      font_family: tenant?.tenant_config?.font_family || "Inter",
      background_image_url: tenant?.tenant_config?.background_image_url || "",
      hero_title: tenant?.tenant_config?.hero_title || "Como posso ajudar você hoje?",
      hero_subtitle: tenant?.tenant_config?.hero_subtitle || "Faça perguntas sobre nossos serviços",
      chat_placeholder: tenant?.tenant_config?.chat_placeholder || "Digite sua mensagem...",
      welcome_message: tenant?.tenant_config?.welcome_message || {
        title: "Bem-vindo",
        subtitle: "Estamos aqui para ajudar",
      },
      enable_google_auth: tenant?.tenant_config?.enable_google_auth ?? true,
      enable_guest_access: tenant?.tenant_config?.enable_guest_access ?? false,
      enable_file_upload: tenant?.tenant_config?.enable_file_upload ?? false,
      enable_conversation_export: tenant?.tenant_config?.enable_conversation_export ?? true,
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5242880) {
      toast.error("Arquivo muito grande. Máximo: 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("tenant-logos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("tenant-logos")
        .getPublicUrl(filePath);

      form.setValue("logo_url", data.publicUrl);
      setLogoPreview(data.publicUrl);
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    form.setValue("logo_url", "");
    setLogoPreview("");
  };

  const handleOpenAiDialog = (type: ImageType) => {
    setCurrentImageType(type);
    setAiDialogOpen(true);
  };

  const handleImageGenerated = (url: string) => {
    if (currentImageType === 'logo') {
      form.setValue("logo_url", url);
      setLogoPreview(url);
    } else if (currentImageType === 'background') {
      form.setValue("background_image_url", url);
    }
  };

  const onSubmit = (data: TenantFormValues) => {
    if (tenant) {
      updateTenant.mutate({ id: tenant.id, ...data }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    } else {
      createTenant.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  const watchedValues = form.watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? "Editar Tenant" : "Criar Tenant"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="features">Recursos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do tenant" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="tenant-slug" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL pública: /{field.value || "seu-slug"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domínio (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="branding" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                {logoPreview ? (
                                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6"
                                      onClick={removeLogo}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleLogoUpload}
                                      className="hidden"
                                      disabled={uploading}
                                    />
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                  </label>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleOpenAiDialog('logo')}
                                  className="flex-1 h-32"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                    <span className="text-sm">Gerar com IA</span>
                                    <span className="text-xs text-muted-foreground">GRATUITO</span>
                                  </div>
                                </Button>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Ou cole uma URL: <Input {...field} placeholder="https://exemplo.com/logo.png" className="mt-2" />
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="background_image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imagem de Background</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {field.value && (
                                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                                  <img src={field.value} alt="Background preview" className="w-full h-full object-cover" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => field.onChange("")}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Input {...field} placeholder="https://exemplo.com/background.jpg" className="flex-1" />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleOpenAiDialog('background')}
                                  className="shrink-0"
                                >
                                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                                  Gerar com IA
                                </Button>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            URL da imagem de fundo para rotas públicas (ex: /plano-diretor)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="primary_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Primária</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" {...field} className="w-16 h-10 p-1" />
                                <Input {...field} placeholder="#000000" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondary_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secundária</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" {...field} className="w-16 h-10 p-1" />
                                <Input {...field} placeholder="#666666" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accent_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destaque</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" {...field} className="w-16 h-10 p-1" />
                                <Input {...field} placeholder="#0066CC" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="hero_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título Principal</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hero_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtítulo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="chat_placeholder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placeholder do Chat</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="font_family"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fonte</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma fonte" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GOOGLE_FONTS.map((font) => (
                                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Fonte customizada do Google Fonts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enable_google_auth"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Google OAuth</FormLabel>
                            <FormDescription>Permitir login com Google</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="enable_guest_access"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Acesso de Convidados</FormLabel>
                            <FormDescription>Permitir uso sem login</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="enable_file_upload"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Upload de Arquivos</FormLabel>
                            <FormDescription>Permitir anexos no chat</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="enable_conversation_export"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Exportar Conversas</FormLabel>
                            <FormDescription>Permitir download do histórico</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTenant.isPending || updateTenant.isPending || uploading}>
                    {tenant ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Preview Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <h3 className="text-sm font-medium mb-3">Preview em Tempo Real</h3>
              <div 
                className="rounded-lg border overflow-hidden relative"
                style={{
                  backgroundColor: watchedValues.primary_color + "10",
                  borderColor: watchedValues.primary_color + "40",
                  backgroundImage: watchedValues.background_image_url ? `url(${watchedValues.background_image_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                 <div 
                  className="p-6 space-y-4 relative z-10" 
                  style={{ 
                    color: watchedValues.primary_color,
                    backgroundColor: watchedValues.background_image_url ? "rgba(255, 255, 255, 0.9)" : undefined,
                    fontFamily: watchedValues.font_family ? `"${watchedValues.font_family}", sans-serif` : undefined,
                  }}
                >
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="h-12 object-contain" />
                  )}
                  <h2 className="text-2xl font-bold">{watchedValues.hero_title || "Como posso ajudar você hoje?"}</h2>
                  <p className="text-sm opacity-80">{watchedValues.hero_subtitle || "Faça perguntas sobre nossos serviços"}</p>
                  <div className="flex gap-2 flex-wrap">
                    <div 
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: watchedValues.primary_color, color: "white" }}
                    >
                      Primária
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: watchedValues.secondary_color, color: "white" }}
                    >
                      Secundária
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: watchedValues.accent_color, color: "white" }}
                    >
                      Destaque
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground">{watchedValues.chat_placeholder || "Digite sua mensagem..."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Image Generator Dialog */}
        <ImageGeneratorDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          imageType={currentImageType}
          tenantId={tenant?.id || 'new'}
          onImageGenerated={handleImageGenerated}
        />
      </DialogContent>
    </Dialog>
  );
}
