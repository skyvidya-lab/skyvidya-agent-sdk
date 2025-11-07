import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isPlayground = location.pathname === '/playground';

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("current_tenant_id")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <AppLayout>
      {isPlayground ? (
        <div className="h-full max-h-full">
          <ChatInterface isPlayground={true} />
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando workspace...</p>
          </div>
        </div>
      ) : profile?.current_tenant_id ? (
        <div className="h-full max-h-full">
          <ChatInterface tenantId={profile.current_tenant_id} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="rounded-full bg-primary/10 p-6 inline-block mb-4">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Nenhum Workspace Selecionado</h3>
            <p className="text-muted-foreground max-w-md">
              Selecione um workspace no menu lateral para usar o chat
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Chat;
