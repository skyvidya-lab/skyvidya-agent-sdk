import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ConversationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ConversationSearchInput({ 
  value, 
  onChange, 
  placeholder = "Buscar conversas..." 
}: ConversationSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
