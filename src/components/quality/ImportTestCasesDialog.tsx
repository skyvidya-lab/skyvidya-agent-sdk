import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useBulkImportTestCases } from '@/hooks/useTestCases';
import { toast } from 'sonner';

interface ImportTestCasesDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportTestCasesDialog = ({ workspaceId, open, onOpenChange }: ImportTestCasesDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const importMutation = useBulkImportTestCases();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    // Parse CSV
    const text = await selectedFile.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const parsed = lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj;
    });

    setPreview(parsed.slice(0, 5)); // Show first 5 rows
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const testCases = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });

        return {
          workspace_id: workspaceId,
          category: obj.category || 'Geral',
          question: obj.question,
          expected_answer: obj.expected_answer,
          expected_score_min: parseFloat(obj.expected_score_min || '85'),
          tags: obj.tags ? obj.tags.split(',').map((t: string) => t.trim()) : [],
          is_active: true,
          agent_id: null,
        };
      }).filter(tc => tc.question && tc.expected_answer);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await importMutation.mutateAsync({
        workspaceId,
        testCases,
      });

      clearInterval(interval);
      setProgress(100);
      setResult({ success: testCases.length, failed: 0 });
      
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 2000);
    } catch (error) {
      toast.error('Erro ao importar casos de teste');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview([]);
    setProgress(0);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Casos de Teste (CSV)</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os casos de teste. Formato esperado: category, question, expected_answer, expected_score_min, tags
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result && (
            <>
              <div className="space-y-2">
                <Label htmlFor="csv-file">Arquivo CSV</Label>
                <div className="flex gap-2">
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                </div>
              </div>

              {preview.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Preview (primeiras 5 linhas)</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {preview.map((row, i) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded border-l-2 border-primary">
                        <div><strong>Categoria:</strong> {row.category}</div>
                        <div><strong>Pergunta:</strong> {row.question}</div>
                        <div><strong>Resposta esperada:</strong> {row.expected_answer?.substring(0, 100)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">Importando casos de teste... {progress}%</p>
                </div>
              )}
            </>
          )}

          {result && (
            <div className="p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Importação Concluída!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {result.success} casos de teste importados com sucesso
                </p>
              </div>
            </div>
          )}

          {!result && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!file || importing || preview.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
