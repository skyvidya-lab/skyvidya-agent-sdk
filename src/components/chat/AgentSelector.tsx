import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentSelectorProps {
  workspaceId: string;
  selectedAgentId?: string;
  onSelectAgent: (agentId: string) => void;
}

export function AgentSelector({ workspaceId, selectedAgentId, onSelectAgent }: AgentSelectorProps) {
  const { data: workspaceAgents, isLoading } = useWorkspaceAgents(workspaceId);

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
        ) : !workspaceAgents || workspaceAgents.length === 0 ? (
          <SelectItem value="empty" disabled>
            Nenhum agente habilitado neste workspace
          </SelectItem>
        ) : (
          workspaceAgents.map((wa) => (
            <SelectItem key={wa.agent.id} value={wa.agent.id}>
              {wa.agent.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
