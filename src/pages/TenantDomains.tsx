import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DomainForm } from "@/components/tenants/DomainForm";
import { DomainList } from "@/components/tenants/DomainList";

export default function TenantDomains() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div>Tenant ID não encontrado</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/tenants")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Workspaces
          </Button>
          <h1 className="text-3xl font-bold">Gerenciar Domínios</h1>
          <p className="text-muted-foreground mt-2">
            Configure domínios customizados para acesso direto ao seu workspace
          </p>
        </div>

        <div className="space-y-6">
          <DomainForm tenantId={id} />
          <DomainList tenantId={id} />
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Como funciona?</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Adicione seu domínio customizado acima</li>
            <li>Configure os registros DNS conforme as instruções</li>
            <li>Aguarde a propagação do DNS (até 48 horas)</li>
            <li>Clique em "Verificar" para validar a configuração</li>
            <li>Após verificado, seu domínio estará ativo automaticamente</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
