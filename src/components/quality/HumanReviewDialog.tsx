import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateHumanReview } from '@/hooks/useAgreementAnalysis';
import { CheckCircle } from 'lucide-react';

interface HumanReviewDialogProps {
  agreementId: string;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HumanReviewDialog = ({ agreementId, workspaceId, open, onOpenChange }: HumanReviewDialogProps) => {
  const [notes, setNotes] = useState('');
  const updateReview = useUpdateHumanReview();

  const handleSubmit = async () => {
    if (!notes.trim()) {
      return;
    }

    await updateReview.mutateAsync({
      id: agreementId,
      workspaceId,
      notes: notes.trim(),
    });

    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Revisão Humana
          </DialogTitle>
          <DialogDescription>
            Adicione suas observações sobre este caso de teste e a discordância entre os agentes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-notes">Notas da Revisão</Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva suas observações sobre este caso:&#10;&#10;- Qual agente teve a melhor resposta?&#10;- Por que houve discordância?&#10;- O que precisa ser ajustado?&#10;- Há problemas com a pergunta ou resposta esperada?"
              rows={12}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Suas observações ajudarão a melhorar os agentes e os casos de teste
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!notes.trim() || updateReview.isPending}
            >
              {updateReview.isPending ? 'Salvando...' : 'Salvar Revisão'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
