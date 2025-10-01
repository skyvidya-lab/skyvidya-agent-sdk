import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          tenant_config (*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenant: any) => {
      const { 
        secondary_color, accent_color, font_family, background_image_url,
        hero_title, hero_subtitle, chat_placeholder, welcome_message,
        enable_google_auth, enable_guest_access, enable_file_upload, enable_conversation_export,
        ...tenantData 
      } = tenant;

      const { data: tenantResult, error: tenantError } = await supabase
        .from("tenants")
        .insert(tenantData)
        .select()
        .single();
      
      if (tenantError) throw tenantError;

      const { error: configError } = await supabase
        .from("tenant_config")
        .insert({
          tenant_id: tenantResult.id,
          secondary_color,
          accent_color,
          font_family,
          background_image_url,
          hero_title,
          hero_subtitle,
          chat_placeholder,
          welcome_message,
          enable_google_auth,
          enable_guest_access,
          enable_file_upload,
          enable_conversation_export,
        });
      
      if (configError) throw configError;
      return tenantResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant criado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar tenant");
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...tenant }: any) => {
      const { 
        secondary_color, accent_color, font_family, background_image_url,
        hero_title, hero_subtitle, chat_placeholder, welcome_message,
        enable_google_auth, enable_guest_access, enable_file_upload, enable_conversation_export,
        ...tenantData 
      } = tenant;

      const { data: tenantResult, error: tenantError } = await supabase
        .from("tenants")
        .update(tenantData)
        .eq("id", id)
        .select()
        .single();
      
      if (tenantError) throw tenantError;

      await supabase
        .from("tenant_config")
        .upsert({
          tenant_id: id,
          secondary_color,
          accent_color,
          font_family,
          background_image_url,
          hero_title,
          hero_subtitle,
          chat_placeholder,
          welcome_message,
          enable_google_auth,
          enable_guest_access,
          enable_file_upload,
          enable_conversation_export,
        }, { onConflict: "tenant_id" })
        .select()
        .maybeSingle();
      return tenantResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant atualizado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar tenant");
    },
  });
}
