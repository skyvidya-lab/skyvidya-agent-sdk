import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageData {
  role: string;
  content: string;
  created_at: string;
  latency_ms?: number;
}

interface MessageProps {
  message: MessageData;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1 space-y-1", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2 max-w-[80%]",
            isUser
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ node, inline, className, children, ...props }: any) => {
                    return inline ? (
                      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto" {...props}>
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="text-sm list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="text-sm list-decimal ml-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(message.created_at).toLocaleTimeString()}
          {message.latency_ms && ` • ${(message.latency_ms / 1000).toFixed(1)}s`}
        </p>
      </div>
    </div>
  );
}
