import { useTenants } from "@/hooks/useTenants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface WorkspaceSelectorProps {
  value: string | null;
  onChange: (workspaceId: string) => void;
  placeholder?: string;
}

export function WorkspaceSelector({ value, onChange, placeholder = "Selecione um workspace" }: WorkspaceSelectorProps) {
  const { data: tenants, isLoading } = useTenants();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-muted/50 animate-pulse">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando workspaces...</span>
      </div>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-muted/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Nenhum workspace disponível</span>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-[280px]">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {tenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            <div className="flex items-center gap-2">
              {tenant.logo_url && (
                <img src={tenant.logo_url} alt="" className="h-4 w-4 object-contain" />
              )}
              <span>{tenant.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
