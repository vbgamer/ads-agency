import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Send, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAddTicketMessage, type TicketMessage } from "@/hooks/useSupportTickets";
import { useAuth } from "@/hooks/useAuth";

interface TicketMessageThreadProps {
  ticketId: string;
  messages: TicketMessage[];
  ticketStatus: string;
}

export function TicketMessageThread({ ticketId, messages, ticketStatus }: TicketMessageThreadProps) {
  const { user, isAdmin } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const addMessage = useAddTicketMessage();

  const canReply = ticketStatus !== 'closed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addMessage.mutateAsync({
      ticketId,
      message: newMessage.trim(),
    });
    setNewMessage("");
  };

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Add a reply below.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === user?.id}
            />
          ))
        )}
      </div>

      {/* Reply Form */}
      {canReply ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={2000}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {newMessage.length}/2000
            </span>
            <Button type="submit" disabled={!newMessage.trim() || addMessage.isPending}>
              {addMessage.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Reply
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-4 bg-muted rounded-lg">
          This ticket is closed. You cannot add new replies.
        </p>
      )}
    </div>
  );
}

function MessageBubble({ message, isOwnMessage }: { message: TicketMessage; isOwnMessage: boolean }) {
  const isAdmin = message.sender_type === 'admin';

  return (
    <div className={cn("flex gap-3", isOwnMessage && "flex-row-reverse")}>
      <Avatar className={cn("h-8 w-8 flex-shrink-0", isAdmin && "bg-primary")}>
        <AvatarFallback className={cn(isAdmin && "bg-primary text-primary-foreground")}>
          {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1 max-w-[80%]", isOwnMessage && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-lg px-4 py-2 text-sm",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : isAdmin
              ? "bg-blue-100 dark:bg-blue-900/30 text-foreground"
              : "bg-muted"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        <p className={cn("text-xs text-muted-foreground mt-1", isOwnMessage && "text-right")}>
          {isAdmin ? "Support Team" : "You"} • {format(new Date(message.created_at), "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}
