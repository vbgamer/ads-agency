import { format, formatDistanceToNow } from "date-fns";
import { Loader2, ArrowLeft, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTicketDetails } from "@/hooks/useSupportTickets";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketCategoryBadge } from "./TicketCategoryBadge";
import { TicketMessageThread } from "./TicketMessageThread";

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

export function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { data: ticket, isLoading } = useTicketDetails(ticketId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Ticket not found</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tickets
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Button>

      {/* Ticket Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketCategoryBadge category={ticket.category} />
          </div>
          <CardTitle className="text-xl">{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {format(new Date(ticket.created_at), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
            </div>
            {ticket.resolved_at && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <span>Resolved {format(new Date(ticket.resolved_at), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketMessageThread
            ticketId={ticket.id}
            messages={ticket.messages}
            ticketStatus={ticket.status}
          />
        </CardContent>
      </Card>
    </div>
  );
}
