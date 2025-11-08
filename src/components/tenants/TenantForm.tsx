import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Upload, X, Sparkles, Bot, Palette } from "lucide-react";
import { ImageGeneratorDialog } from "./ImageGeneratorDialog";
import type { ImageType } from "@/lib/imagePromptTemplates";
import { useAllAvailableAgents, useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
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

// Fontes populares do Google Fonts (expandido)
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
  "Source Sans Pro",
  "Merriweather",
  "PT Sans",
  "Oswald",
  "Work Sans",
  "Quicksand",
  "Fira Sans",
  "DM Sans",
  "Space Grotesk",
  "Plus Jakarta Sans",
];

// Paletas de cores para modo claro
const COLOR_PALETTES = [
  {
    name: "Azul Profissional",
    primary: "#0066CC",
    secondary: "#004C99",
    accent: "#00A3FF",
  },
  {
    name: "Verde Natureza",
    primary: "#10B981",
    secondary: "#059669",
    accent: "#34D399",
  },
  {
    name: "Roxo Moderno",
    primary: "#8B5CF6",
    secondary: "#7C3AED",
    accent: "#A78BFA",
  },
  {
    name: "Laranja Vibrante",
    primary: "#F97316",
    secondary: "#EA580C",
    accent: "#FB923C",
  },
  {
    name: "Rosa Criativo",
    primary: "#EC4899",
    secondary: "#DB2777",
    accent: "#F472B6",
  },
  {
    name: "Azul Céu",
    primary: "#0EA5E9",
    secondary: "#0284C7",
    accent: "#38BDF8",
  },
  {
    name: "Vermelho Energia",
    primary: "#EF4444",
    secondary: "#DC2626",
    accent: "#F87171",
  },
  {
    name: "Cinza Elegante",
    primary: "#1F2937",
    secondary: "#374151",
    accent: "#6B7280",
  },
];

// Paletas de cores para modo escuro
const DARK_PALETTES = [
  {
    name: "Azul Noturno",
    primary: "#60A5FA",
    secondary: "#3B82F6",
    accent: "#93C5FD",
  },
  {
    name: "Verde Neon",
    primary: "#34D399",
    secondary: "#10B981",
    accent: "#6EE7B7",
  },
  {
    name: "Roxo Vibrante",
    primary: "#A78BFA",
    secondary: "#8B5CF6",
    accent: "#C4B5FD",
  },
  {
    name: "Laranja Quente",
    primary: "#FB923C",
    secondary: "#F97316",
    accent: "#FDBA74",
  },
  {
    name: "Rosa Elétrico",
    primary: "#F472B6",
    secondary: "#EC4899",
    accent: "#F9A8D4",
  },
  {
    name: "Ciano Brilhante",
    primary: "#38BDF8",
    secondary: "#0EA5E9",
    accent: "#7DD3FC",
  },
  {
    name: "Vermelho Intenso",
    primary: "#F87171",
    secondary: "#EF4444",
    accent: "#FCA5A5",
  },
  {
    name: "Cinza Escuro",
    primary: "#9CA3AF",
    secondary: "#6B7280",
    accent: "#D1D5DB",
  },
];

const tenantSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres").max(50).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  domain: z.string().url("Domínio inválido").optional().or(z.literal("")),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  default_theme: z.enum(['light', 'dark']).default('light'),
  light_theme_colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  }).default({
    primary: '#000000',
    secondary: '#666666',
    accent: '#0066CC',
  }),
  dark_theme_colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  }).default({
    primary: '#ffffff',
    secondary: '#a0a0a0',
    accent: '#3b82f6',
  }),
  font_family: z.string().default("Inter"),
  background_image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  hero_title: z.string().default("Como posso ajudar você hoje?"),
  hero_subtitle: z.string().default("Faça perguntas sobre nossos serviços"),
  chat_placeholder: z.string().default("Digite sua mensagem..."),
  welcome_message: z.object({
    title: z.string().default("Bem-vindo"),
    subtitle: z.string().default("Estamos aqui para ajudar"),
  }),
  default_entry_point: z.enum(['landing', 'auth']).default('landing'),
  enable_google_auth: z.boolean().default(true),
  enable_guest_access: z.boolean().default(false),
  enable_file_upload: z.boolean().default(false),
  enable_conversation_export: z.boolean().default(true),
  enabled_agent_ids: z.array(z.string()).default([]),
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
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [logoPreview, setLogoPreview] = useState(tenant?.logo_url || "");
  const [backgroundPreview, setBackgroundPreview] = useState(tenant?.tenant_config?.background_image_url || "");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<ImageType>('logo');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("current_tenant_id")
        .eq("id", user?.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: availableAgents, isLoading: isLoadingAgents } = useAllAvailableAgents(profile?.current_tenant_id);
  const { data: currentWorkspaceAgents } = useWorkspaceAgents(tenant?.id);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: tenant?.name || "",
      slug: tenant?.slug || "",
      domain: tenant?.domain || "",
      logo_url: tenant?.logo_url || "",
      default_theme: tenant?.tenant_config?.default_theme || 'light',
      light_theme_colors: tenant?.tenant_config?.light_theme_colors || {
        primary: '#000000',
        secondary: '#666666',
        accent: '#0066CC',
      },
      dark_theme_colors: tenant?.tenant_config?.dark_theme_colors || {
        primary: '#ffffff',
        secondary: '#a0a0a0',
        accent: '#3b82f6',
      },
      font_family: tenant?.tenant_config?.font_family || "Inter",
      background_image_url: tenant?.tenant_config?.background_image_url || "",
      hero_title: tenant?.tenant_config?.hero_title || "Como posso ajudar você hoje?",
      hero_subtitle: tenant?.tenant_config?.hero_subtitle || "Faça perguntas sobre nossos serviços",
      chat_placeholder: tenant?.tenant_config?.chat_placeholder || "Digite sua mensagem...",
      welcome_message: tenant?.tenant_config?.welcome_message || {
        title: "Bem-vindo",
        subtitle: "Estamos aqui para ajudar",
      },
      default_entry_point: tenant?.tenant_config?.default_entry_point || 'landing',
      enable_google_auth: tenant?.tenant_config?.enable_google_auth ?? true,
      enable_guest_access: tenant?.tenant_config?.enable_guest_access ?? false,
      enable_file_upload: tenant?.tenant_config?.enable_file_upload ?? false,
      enable_conversation_export: tenant?.tenant_config?.enable_conversation_export ?? true,
      enabled_agent_ids: currentWorkspaceAgents?.filter(wa => wa.agent?.id)?.map(wa => wa.agent.id) || [],
    },
  });

  // Reset form quando tenant, open ou workspaceAgents mudarem
  useEffect(() => {
    if (open) {
      const defaultValues: TenantFormValues = {
        name: tenant?.name || "",
        slug: tenant?.slug || "",
        domain: tenant?.domain || "",
        logo_url: tenant?.logo_url || "",
        default_theme: tenant?.tenant_config?.default_theme || 'light',
        light_theme_colors: tenant?.tenant_config?.light_theme_colors || {
          primary: '#000000',
          secondary: '#666666',
          accent: '#0066CC',
        },
        dark_theme_colors: tenant?.tenant_config?.dark_theme_colors || {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          accent: '#3b82f6',
        },
        font_family: tenant?.tenant_config?.font_family || "Inter",
        background_image_url: tenant?.tenant_config?.background_image_url || "",
        hero_title: tenant?.tenant_config?.hero_title || "Como posso ajudar você hoje?",
        hero_subtitle: tenant?.tenant_config?.hero_subtitle || "Faça perguntas sobre nossos serviços",
        chat_placeholder: tenant?.tenant_config?.chat_placeholder || "Digite sua mensagem...",
        welcome_message: tenant?.tenant_config?.welcome_message || {
          title: "Bem-vindo",
          subtitle: "Estamos aqui para ajudar",
        },
        default_entry_point: tenant?.tenant_config?.default_entry_point || 'landing',
        enable_google_auth: tenant?.tenant_config?.enable_google_auth ?? true,
        enable_guest_access: tenant?.tenant_config?.enable_guest_access ?? false,
        enable_file_upload: tenant?.tenant_config?.enable_file_upload ?? false,
        enable_conversation_export: tenant?.tenant_config?.enable_conversation_export ?? true,
        enabled_agent_ids: currentWorkspaceAgents?.filter(wa => wa.agent?.id)?.map(wa => wa.agent.id) || [],
      };
      
      form.reset(defaultValues);
      setLogoPreview(tenant?.logo_url || "");
      setBackgroundPreview(tenant?.tenant_config?.background_image_url || "");
      setPreviewTheme(tenant?.tenant_config?.default_theme || 'light');
    }
  }, [tenant, open, currentWorkspaceAgents, form]);

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

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10485760) { // 10MB
      toast.error("Arquivo muito grande. Máximo: 10MB");
      return;
    }

    setUploadingBackground(true);
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

      form.setValue("background_image_url", data.publicUrl);
      setBackgroundPreview(data.publicUrl);
      toast.success("Background enviado com sucesso!");
    } catch (error) {
      console.error("Error uploading background:", error);
      toast.error("Erro ao enviar background");
    } finally {
      setUploadingBackground(false);
    }
  };

  const removeBackground = () => {
    form.setValue("background_image_url", "");
    setBackgroundPreview("");
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
      setBackgroundPreview(url);
    }
  };

  const applyColorPalette = (palette: typeof COLOR_PALETTES[0] | typeof DARK_PALETTES[0]) => {
    if (previewTheme === 'light') {
      form.setValue("light_theme_colors.primary", palette.primary);
      form.setValue("light_theme_colors.secondary", palette.secondary);
      form.setValue("light_theme_colors.accent", palette.accent);
    } else {
      form.setValue("dark_theme_colors.primary", palette.primary);
      form.setValue("dark_theme_colors.secondary", palette.secondary);
      form.setValue("dark_theme_colors.accent", palette.accent);
    }
    toast.success(`Paleta "${palette.name}" aplicada!`);
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
          <DialogTitle>{tenant ? "Editar Workspace" : "Criar Workspace"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="features">Recursos</TabsTrigger>
                    <TabsTrigger value="agents">Agentes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do workspace" {...field} />
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
                              {backgroundPreview && (
                                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                                  <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-cover" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={removeBackground}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundUpload}
                                    className="hidden"
                                    disabled={uploadingBackground}
                                  />
                                  <div className="flex flex-col items-center gap-1">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Upload</span>
                                  </div>
                                </label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleOpenAiDialog('background')}
                                  className="h-20"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <span className="text-xs">Gerar com IA</span>
                                  </div>
                                </Button>
                              </div>
                              <Input {...field} placeholder="Ou cole uma URL: https://exemplo.com/bg.jpg" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Imagem de fundo para rotas públicas (máx: 10MB)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Seletor de Tema Padrão */}
                    <FormField
                      control={form.control}
                      name="default_theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tema Padrão</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">🌞 Claro</SelectItem>
                              <SelectItem value="dark">🌙 Escuro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tema padrão exibido aos usuários
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preview do Tema em Tempo Real */}
                    <div className="space-y-3">
                      <FormLabel>Editar Cores do Tema</FormLabel>
                      <Tabs value={previewTheme} onValueChange={(v) => setPreviewTheme(v as 'light' | 'dark')}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="light">🌞 Modo Claro</TabsTrigger>
                          <TabsTrigger value="dark">🌙 Modo Escuro</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Paletas Predefinidas para o tema selecionado */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="text-sm">Paletas {previewTheme === 'light' ? 'Claras' : 'Escuras'}</FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(previewTheme === 'light' ? COLOR_PALETTES : DARK_PALETTES).map((palette) => (
                          <Button
                            key={palette.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyColorPalette(palette)}
                            className="justify-start gap-2 h-auto py-2"
                          >
                            <div className="flex gap-1">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: palette.primary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: palette.secondary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: palette.accent }}
                              />
                            </div>
                            <span className="text-xs">{palette.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Cores do Modo Claro */}
                    {previewTheme === 'light' && (
                      <div className="space-y-3 p-4 border rounded-lg bg-white">
                        <FormLabel className="text-sm font-medium">Cores do Modo Claro</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name="light_theme_colors.primary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Primária</FormLabel>
                                <div className="flex flex-col gap-1">
                                  <Input type="color" {...field} className="w-full h-10 p-1" />
                                  <Input {...field} placeholder="#000000" className="text-xs" />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="light_theme_colors.secondary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Secundária</FormLabel>
                                <div className="flex flex-col gap-1">
                                  <Input type="color" {...field} className="w-full h-10 p-1" />
                                  <Input {...field} placeholder="#666666" className="text-xs" />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="light_theme_colors.accent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Destaque</FormLabel>
                                <div className="flex flex-col gap-1">
                                  <Input type="color" {...field} className="w-full h-10 p-1" />
                                  <Input {...field} placeholder="#0066CC" className="text-xs" />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Cores do Modo Escuro */}
                    {previewTheme === 'dark' && (
                      <div className="space-y-3 p-4 border rounded-lg bg-gray-900 text-white">
                        <FormLabel className="text-sm font-medium text-white">Cores do Modo Escuro</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name="dark_theme_colors.primary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-white">Primária</FormLabel>
                                <div className="flex flex-col gap-1">
                                  <Input type="color" {...field} className="w-full h-10 p-1" />
                                  <Input {...field} placeholder="#ffffff" className="text-xs" />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="dark_theme_colors.secondary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-white">Secundária</FormLabel>
                                <div className="flex flex-col gap-1">
                                  <Input type="color" {...field} className="w-full h-10 p-1" />
                                  <Input {...field} placeholder="#a0a0a0" className="text-xs" />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="dark_theme_colors.accent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-white">Destaque</FormLabel>
                                <div className="flex flex-col gap-1">
                                  <Input type="color" {...field} className="w-full h-10 p-1" />
                                  <Input {...field} placeholder="#3b82f6" className="text-xs" />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                    
                    <FormField
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
                      name="default_entry_point"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Página Inicial Padrão</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="landing">🏠 Landing Page (Hero + CTAs)</SelectItem>
                              <SelectItem value="auth">🔐 Login/Cadastro Direto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Define qual página o usuário vê ao acessar pela primeira vez
                          </FormDescription>
                        </FormItem>
                      )}
                    />
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

                  <TabsContent value="agents" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enabled_agent_ids"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Agentes Habilitados</FormLabel>
                            <FormDescription>
                              Selecione quais agentes estarão disponíveis neste workspace
                            </FormDescription>
                          </div>
                          
                          {isLoadingAgents && (
                            <div className="text-sm text-muted-foreground">
                              Carregando agentes disponíveis...
                            </div>
                          )}
                          
                          {!isLoadingAgents && (!availableAgents || availableAgents.length === 0) && (
                            <div className="text-sm text-muted-foreground border rounded-lg p-4">
                              Nenhum agente disponível. Crie agentes na página /agents primeiro.
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            {availableAgents?.map((agent) => (
                              <FormField
                                key={agent.agent.id}
                                control={form.control}
                                name="enabled_agent_ids"
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between rounded-lg border p-4 space-y-0">
                                    <div className="flex items-center gap-3">
                                      {agent.agent.avatar_url && (
                                        <img 
                                          src={agent.agent.avatar_url} 
                                          alt={agent.agent.name} 
                                          className="h-10 w-10 rounded-full object-cover"
                                        />
                                      )}
                                      {!agent.agent.avatar_url && (
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                          <Bot className="h-5 w-5 text-primary" />
                                        </div>
                                      )}
                                      <div>
                                        <FormLabel className="font-medium cursor-pointer">
                                          {agent.agent.name}
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                          {agent.agent.description || `Plataforma: ${agent.agent.platform}`}
                                        </FormDescription>
                                        {agent.agent.is_global && (
                                          <Badge variant="secondary" className="text-xs mt-1">
                                            Global
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(agent.agent.id)}
                                        onCheckedChange={(checked) => {
                                          const currentIds = field.value || [];
                                          const newIds = checked
                                            ? [...currentIds, agent.agent.id]
                                            : currentIds.filter((id) => id !== agent.agent.id);
                                          field.onChange(newIds);
                                        }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
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
                    {(createTenant.isPending || updateTenant.isPending) ? "Salvando..." : tenant ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Preview Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Preview em Tempo Real</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Visualizando tema: {previewTheme === 'light' ? '🌞 Claro' : '🌙 Escuro'}
                </p>
              </div>
              <div 
                className="rounded-lg border overflow-hidden relative transition-colors"
                style={{
                  backgroundColor: previewTheme === 'dark' ? '#1a1a1a' : '#ffffff',
                  borderColor: previewTheme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundImage: watchedValues.background_image_url ? `url(${watchedValues.background_image_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                 <div 
                  className="p-6 space-y-4 relative z-10" 
                  style={{ 
                    color: previewTheme === 'dark' 
                      ? watchedValues.dark_theme_colors?.primary || '#ffffff'
                      : watchedValues.light_theme_colors?.primary || '#000000',
                    backgroundColor: watchedValues.background_image_url 
                      ? previewTheme === 'dark' ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.9)"
                      : undefined,
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
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                      style={{ 
                        backgroundColor: previewTheme === 'dark'
                          ? watchedValues.dark_theme_colors?.primary || '#ffffff'
                          : watchedValues.light_theme_colors?.primary || '#000000'
                      }}
                    >
                      Primária
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                      style={{ 
                        backgroundColor: previewTheme === 'dark'
                          ? watchedValues.dark_theme_colors?.secondary || '#a0a0a0'
                          : watchedValues.light_theme_colors?.secondary || '#666666'
                      }}
                    >
                      Secundária
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                      style={{ 
                        backgroundColor: previewTheme === 'dark'
                          ? watchedValues.dark_theme_colors?.accent || '#3b82f6'
                          : watchedValues.light_theme_colors?.accent || '#0066CC'
                      }}
                    >
                      Destaque
                    </div>
                  </div>
                  <div 
                    className="rounded-lg p-3 border transition-colors"
                    style={{
                      backgroundColor: previewTheme === 'dark' ? '#374151' : '#f9fafb',
                      borderColor: previewTheme === 'dark' ? '#4b5563' : '#e5e7eb',
                    }}
                  >
                    <p 
                      className="text-xs"
                      style={{ 
                        color: previewTheme === 'dark' ? '#9ca3af' : '#6b7280' 
                      }}
                    >
                      {watchedValues.chat_placeholder || "Digite sua mensagem..."}
                    </p>
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
