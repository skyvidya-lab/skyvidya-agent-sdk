import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {conversations.map((conv) => (
          <Button
            key={conv.id}
            variant="ghost"
            className={cn(
              "w-full justify-start text-left h-auto py-3 px-3",
              selectedId === conv.id && "bg-muted"
            )}
            onClick={() => onSelect(conv.id)}
          >
            <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-medium">{conv.title || "Sem título"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(conv.updated_at).toLocaleDateString()}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
