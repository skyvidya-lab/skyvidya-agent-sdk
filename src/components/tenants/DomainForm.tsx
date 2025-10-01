import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddDomain } from "@/hooks/useTenantDomains";
import { Globe } from "lucide-react";

interface DomainFormProps {
  tenantId: string;
}

export function DomainForm({ tenantId }: DomainFormProps) {
  const [domain, setDomain] = useState("");
  const addDomainMutation = useAddDomain();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    // Remove http://, https://, www., trailing slashes
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    addDomainMutation.mutate(
      { tenantId, domain: cleanDomain },
      {
        onSuccess: () => setDomain(""),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Adicionar Domínio Customizado
        </CardTitle>
        <CardDescription>
          Configure um domínio personalizado para seu tenant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domínio</Label>
            <Input
              id="domain"
              placeholder="exemplo: chat.suaempresa.com.br"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={addDomainMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Digite apenas o domínio, sem http:// ou https://
            </p>
          </div>
          <Button type="submit" disabled={addDomainMutation.isPending}>
            {addDomainMutation.isPending ? "Adicionando..." : "Adicionar Domínio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
