import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Ticket, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserTickets, type TicketStatus, type SupportTicket } from "@/hooks/useSupportTickets";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketCategoryBadge } from "./TicketCategoryBadge";

interface TicketListProps {
  onSelectTicket: (ticketId: string) => void;
}

export function TicketList({ onSelectTicket }: TicketListProps) {
  const { data: tickets, isLoading } = useUserTickets();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const filteredTickets = tickets?.filter((ticket) => {
    if (statusFilter === "all") return true;
    return ticket.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredTickets?.length || 0} ticket{filteredTickets?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Ticket List */}
      {!filteredTickets || filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Ticket className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              {statusFilter === "all" ? "No support tickets yet" : `No ${statusFilter.replace('_', ' ')} tickets`}
            </p>
            <p className="text-sm text-muted-foreground">
              Create a new ticket if you need help
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onSelectTicket(ticket.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TicketStatusBadge status={ticket.status} />
            <TicketCategoryBadge category={ticket.category} showIcon={false} />
          </div>
          <h4 className="font-medium truncate">{ticket.subject}</h4>
          <p className="text-sm text-muted-foreground">
            Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
