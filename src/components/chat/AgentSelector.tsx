import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentSelectorProps {
  selectedAgentId?: string;
  onSelectAgent: (agentId: string) => void;
}

export function AgentSelector({ selectedAgentId, onSelectAgent }: AgentSelectorProps) {
  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("status", "active")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Select value={selectedAgentId} onValueChange={onSelectAgent}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um agente" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Carregando...
          </SelectItem>
        ) : agents?.length === 0 ? (
          <SelectItem value="empty" disabled>
            Nenhum agente disponível
          </SelectItem>
        ) : (
          agents?.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
