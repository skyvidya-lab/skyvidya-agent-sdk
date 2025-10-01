import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, FileIcon } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  enableFileUpload?: boolean;
}

export function ChatInput({ 
  onSend, 
  disabled, 
  placeholder = "Digite sua mensagem...",
  enableFileUpload = false 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;
    onSend(message, attachments);
    setMessage("");
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`${file.name} é muito grande. Máximo: 10MB`);
        return false;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} não é um tipo suportado`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
            >
              <FileIcon className="h-4 w-4" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {enableFileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="h-[60px] w-[60px] shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </>
        )}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] max-h-[200px]"
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled}
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Pressione Enter para enviar, Shift+Enter para nova linha
      </p>
    </div>
  );
}
