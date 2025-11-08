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
        enabled_agent_ids,
        default_theme, light_theme_colors, dark_theme_colors,
        font_family, background_image_url,
        hero_title, hero_subtitle, chat_placeholder, welcome_message,
        default_entry_point,
        enable_google_auth, enable_guest_access, enable_file_upload, enable_conversation_export,
        ...tenantData 
      } = tenant;

      const { data: tenantResult, error: tenantError } = await supabase
        .from("tenants")
        .insert(tenantData)
        .select()
        .single();
      
      if (tenantError) throw tenantError;

      // Criar role de super_admin automaticamente para o criador do workspace
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            tenant_id: tenantResult.id,
            role: 'super_admin',
          })
          .select()
          .single();

        if (roleError) {
          console.error("Erro ao criar role de super_admin:", roleError);
          throw new Error(`Falha ao criar permissões: ${roleError.message}`);
        }

        console.log("Role super_admin criada com sucesso:", roleData);

        // Verificar se a role foi realmente criada
        const { data: verifyRole, error: verifyError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantResult.id)
          .eq("role", "super_admin")
          .maybeSingle();

        if (verifyError || !verifyRole) {
          console.error("Falha na verificação da role:", verifyError);
          throw new Error("Role criada mas não encontrada na verificação");
        }

        console.log("Role verificada com sucesso:", verifyRole);
      }

      await supabase
        .from("tenant_config")
        .insert({
          tenant_id: tenantResult.id,
          default_theme,
          light_theme_colors,
          dark_theme_colors,
          font_family,
          background_image_url,
          hero_title,
          hero_subtitle,
          chat_placeholder,
          welcome_message,
          default_entry_point,
          enable_google_auth,
          enable_guest_access,
          enable_file_upload,
          enable_conversation_export,
        })
        .select()
        .maybeSingle();

      // Habilitar agentes selecionados
      if (enabled_agent_ids && enabled_agent_ids.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const workspaceAgentRecords = enabled_agent_ids.map((agentId: string) => ({
          workspace_id: tenantResult.id,
          agent_id: agentId,
          enabled: true,
          enabled_by: user?.id,
        }));

        await supabase
          .from("workspace_agents")
          .insert(workspaceAgentRecords);
      }

      return tenantResult;
    },
    onSuccess: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-agents"] });
      toast.success("Workspace criado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar workspace");
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...tenant }: any) => {
      const { 
        enabled_agent_ids,
        default_theme, light_theme_colors, dark_theme_colors,
        font_family, background_image_url,
        hero_title, hero_subtitle, chat_placeholder, welcome_message,
        default_entry_point,
        enable_google_auth, enable_guest_access, enable_file_upload, enable_conversation_export,
        ...tenantData 
      } = tenant;

      const { data: tenantResult, error: tenantError } = await supabase
        .from("tenants")
        .update(tenantData)
        .eq("id", id)
        .select()
        .maybeSingle();
      
      if (tenantError) throw tenantError;
      if (!tenantResult) throw new Error("Workspace não encontrado ou sem permissão");

      await supabase
        .from("tenant_config")
        .upsert({
          tenant_id: id,
          default_theme,
          light_theme_colors,
          dark_theme_colors,
          font_family,
          background_image_url,
          hero_title,
          hero_subtitle,
          chat_placeholder,
          welcome_message,
          default_entry_point,
          enable_google_auth,
          enable_guest_access,
          enable_file_upload,
          enable_conversation_export,
        }, { onConflict: "tenant_id" })
        .select()
        .maybeSingle();

      // Sincronizar workspace_agents
      if (enabled_agent_ids !== undefined) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Remover todos os agentes atuais
        await supabase
          .from("workspace_agents")
          .delete()
          .eq("workspace_id", id);
        
        // Inserir novos agentes selecionados
        if (enabled_agent_ids.length > 0) {
          const workspaceAgentRecords = enabled_agent_ids.map((agentId: string) => ({
            workspace_id: id,
            agent_id: agentId,
            enabled: true,
            enabled_by: user?.id,
          }));

          await supabase
            .from("workspace_agents")
            .insert(workspaceAgentRecords);
        }
      }

      return tenantResult;
    },
    onSuccess: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-agents"] });
      toast.success("Workspace atualizado com sucesso");
    },
    onError: async (error: any) => {
      console.error("Erro detalhado ao atualizar workspace:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });

      // Verificar se é erro de permissão
      if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('policy')) {
        // Tentar verificar se o usuário tem role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", user.id);
          
          console.log("Roles do usuário atual:", roles);
        }

        toast.error(
          "Você não tem permissão para editar este workspace. Verifique se você é admin."
        );
        return;
      }

      toast.error(
        error.message === "Workspace não encontrado ou sem permissão"
          ? error.message
          : `Erro ao atualizar workspace: ${error.message || 'Verifique suas permissões'}`
      );
    },
  });
}
