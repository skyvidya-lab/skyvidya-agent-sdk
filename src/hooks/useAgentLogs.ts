import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LogFilters {
  tenantId?: string;
  level?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useAgentLogs(filters: LogFilters = {}) {
  const { tenantId, level, startDate, endDate, limit = 100 } = filters;

  return useQuery({
    queryKey: ["agent-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      if (level) {
        query = query.eq("level", level);
      }

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
  });
}

export function useAgentCallMetrics(filters: LogFilters = {}) {
  const { tenantId, startDate, endDate, limit = 100 } = filters;

  return useQuery({
    queryKey: ["agent-call-metrics", filters],
    queryFn: async () => {
      let query = supabase
        .from("agent_calls")
        .select(`
          *,
          agents (
            id,
            name,
            platform
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

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
  });
}
