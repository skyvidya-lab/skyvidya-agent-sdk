import { useState } from "react";
import { useTenants } from "@/hooks/useTenants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { TenantForm } from "./TenantForm";

export function TenantList() {
  const { data: tenants, isLoading } = useTenants();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const handleEdit = (tenant: any) => {
    setSelectedTenant(tenant);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedTenant(null);
    setFormOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Tenant
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants?.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{tenant.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Slug: {tenant.slug}</p>
                {tenant.domain && (
                  <p className="text-sm text-muted-foreground">Domínio: {tenant.domain}</p>
                )}
                <Badge variant={tenant.is_active ? "default" : "secondary"}>
                  {tenant.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TenantForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tenant={selectedTenant}
      />
    </div>
  );
}
