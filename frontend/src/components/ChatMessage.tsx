import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/types/cfms";

type ChatMessageProps = {
  message: ChatMsg;
  isPosterMessage: boolean;
};

export const ChatMessage = ({ message, isPosterMessage }: ChatMessageProps) => (
  <div className={cn("mb-3 flex", isPosterMessage ? "justify-start" : "justify-end")}>
    <div
      className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
        isPosterMessage
          ? "rounded-bl-md border border-amber-200 bg-amber-50 text-amber-950"
          : "rounded-br-md border border-emerald-200 bg-emerald-50 text-emerald-950"
      )}
    >
      <p
        className={cn(
          "mb-1 text-[10px] font-semibold uppercase tracking-[0.04em]",
          isPosterMessage ? "text-amber-700" : "text-emerald-700"
        )}
      >
        {isPosterMessage ? "Poster" : "Freelancer"}
      </p>
      <p className="leading-relaxed">{message.text}</p>
      <p className={cn("mt-1 text-[10px]", isPosterMessage ? "text-amber-700/85" : "text-emerald-700/85")}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  </div>
);
