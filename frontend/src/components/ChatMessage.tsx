import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/types/cfms";

export const ChatMessage = ({ message, isOwn }: { message: ChatMsg; isOwn: boolean }) => (
  <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
    <div
      className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
        isOwn ? "bg-accent text-accent-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"
      )}
    >
      <p>{message.text}</p>
      <p className={cn("text-[10px] mt-1", isOwn ? "text-accent-foreground/60" : "text-muted-foreground")}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  </div>
);
