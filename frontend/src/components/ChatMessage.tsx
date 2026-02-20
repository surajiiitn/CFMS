import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/types/cfms";

export const ChatMessage = ({ message, isOwn }: { message: ChatMsg; isOwn: boolean }) => (
  <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
    <div
      className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
        isOwn
          ? "rounded-br-md bg-primary text-primary-foreground"
          : "rounded-bl-md border border-border bg-card text-card-foreground"
      )}
    >
      <p className="leading-relaxed">{message.text}</p>
      <p className={cn("mt-1 text-[10px]", isOwn ? "text-primary-foreground/65" : "text-muted-foreground")}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  </div>
);
