import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface InterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
}

export function InterestDialog({ open, onOpenChange, tenantName }: InterestDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [interestData, setInterestData] = useState({ 
    name: '', 
    email: '', 
    message: '' 
  });

  const handleInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular envio (em produção, enviar para API)
    setTimeout(() => {
      toast.success('Obrigado pelo interesse! Entraremos em contato em breve.');
      setInterestData({ name: '', email: '', message: '' });
      onOpenChange(false);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Manifestar Interesse
          </DialogTitle>
          <DialogDescription>
            Interessado em usar o {tenantName}? Preencha os dados abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInterest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interest-name">Nome*</Label>
            <Input
              id="interest-name"
              type="text"
              placeholder="Seu nome"
              value={interestData.name}
              onChange={(e) => setInterestData({ ...interestData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest-email">Email*</Label>
            <Input
              id="interest-email"
              type="email"
              placeholder="seu@email.com"
              value={interestData.email}
              onChange={(e) => setInterestData({ ...interestData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest-message">Mensagem (opcional)</Label>
            <Textarea
              id="interest-message"
              placeholder="Conte-nos sobre seu interesse..."
              value={interestData.message}
              onChange={(e) => setInterestData({ ...interestData, message: e.target.value })}
              rows={4}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
