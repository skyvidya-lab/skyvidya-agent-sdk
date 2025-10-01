import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="rounded-lg bg-muted px-4 py-2 max-w-[80%]">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
