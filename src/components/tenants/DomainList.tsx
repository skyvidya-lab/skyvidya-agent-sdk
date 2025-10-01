import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Star,
  Copy,
  AlertCircle 
} from "lucide-react";
import { useTenantDomains, useSetPrimaryDomain, useDeleteDomain, useVerifyDomain } from "@/hooks/useTenantDomains";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DomainListProps {
  tenantId: string;
}

export function DomainList({ tenantId }: DomainListProps) {
  const { data: domains = [], isLoading } = useTenantDomains(tenantId);
  const setPrimaryMutation = useSetPrimaryDomain();
  const deleteMutation = useDeleteDomain();
  const verifyMutation = useVerifyDomain();
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência!");
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando domínios...</div>;
  }

  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum domínio configurado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {domains.map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {domain.domain}
                    {domain.is_primary && (
                      <Star className="h-4 w-4 fill-primary text-primary" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {domain.verified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Verificado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        Aguardando verificação
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!domain.verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyMutation.mutate(domain.id)}
                      disabled={verifyMutation.isPending}
                    >
                      Verificar
                    </Button>
                  )}
                  {domain.verified && !domain.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimaryMutation.mutate({ domainId: domain.id, tenantId })}
                      disabled={setPrimaryMutation.isPending}
                    >
                      Tornar Primário
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDomainToDelete(domain.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {!domain.verified && (
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-2">Configure os seguintes registros DNS:</p>
                    <div className="space-y-2 bg-muted p-3 rounded-md">
                      <div>
                        <p className="text-xs text-muted-foreground">TXT Record:</p>
                        <code className="text-xs flex items-center gap-2">
                          _skyvidya-verification.{domain.domain} = skyvidya-verification={domain.verification_token?.substring(0, 20)}...
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`skyvidya-verification=${domain.verification_token}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <AlertDialog open={!!domainToDelete} onOpenChange={() => setDomainToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover domínio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O domínio será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (domainToDelete) {
                  deleteMutation.mutate({ domainId: domainToDelete, tenantId });
                  setDomainToDelete(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
