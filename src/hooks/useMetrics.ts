import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMetrics(tenantId?: string, startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["metrics", tenantId, startDate, endDate],
    queryFn: async () => {
      if (!tenantId) return null;

      let query = supabase
        .from("metrics")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
    enabled: !!user?.id && !!tenantId,
  });
}

export function useDashboardStats(tenantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Get messages count by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        messagesResult,
        conversationsResult,
        agentsResult,
        recentMessagesResult,
      ] = await Promise.all([
        supabase
          .from("messages")
          .select("id, created_at, role, tokens_used, latency_ms, conversation_id")
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("conversations")
          .select("id, created_at, agent_id, is_active")
          .eq("tenant_id", tenantId),
        supabase
          .from("agents")
          .select("id, name, status")
          .eq("tenant_id", tenantId),
        supabase
          .from("messages")
          .select("id, created_at, conversation_id, role")
          .eq("role", "assistant")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (messagesResult.error) throw messagesResult.error;
      if (conversationsResult.error) throw conversationsResult.error;
      if (agentsResult.error) throw agentsResult.error;
      if (recentMessagesResult.error) throw recentMessagesResult.error;

      // Calculate stats
      const messages = messagesResult.data || [];
      const conversations = conversationsResult.data || [];
      const agents = agentsResult.data || [];
      const recentMessages = recentMessagesResult.data || [];

      // Messages by day
      const messagesByDay = messages.reduce((acc: any, msg) => {
        const date = new Date(msg.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, user: 0, assistant: 0, total: 0 };
        }
        acc[date][msg.role]++;
        acc[date].total++;
        return acc;
      }, {});

      // Messages by agent (via conversations)
      const messagesByAgent = messages.reduce((acc: any, msg) => {
        const conv = conversations.find((c) => c.id === msg.conversation_id);
        if (conv && conv.agent_id) {
          const agent = agents.find((a) => a.id === conv.agent_id);
          const agentName = agent?.name || "Unknown";
          if (!acc[agentName]) {
            acc[agentName] = 0;
          }
          acc[agentName]++;
        }
        return acc;
      }, {});

      // Average response time and tokens
      const assistantMessages = messages.filter((m) => m.role === "assistant");
      const avgLatency = assistantMessages.length
        ? assistantMessages.reduce((sum, m) => sum + (m.latency_ms || 0), 0) /
          assistantMessages.length
        : 0;
      const totalTokens = assistantMessages.reduce(
        (sum, m) => sum + (m.tokens_used || 0),
        0
      );

      return {
        totalMessages: messages.length,
        totalConversations: conversations.length,
        activeConversations: conversations.filter((c) => c.is_active).length,
        totalAgents: agents.length,
        activeAgents: agents.filter((a) => a.status === "active").length,
        messagesByDay: Object.values(messagesByDay),
        messagesByAgent: Object.entries(messagesByAgent).map(([name, count]) => ({
          agent: name,
          messages: count,
        })),
        avgResponseTime: Math.round(avgLatency),
        totalTokens,
        recentActivity: recentMessages.length,
      };
    },
    enabled: !!user?.id && !!tenantId,
  });
}
