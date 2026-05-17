import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Loader2, 
  Search, 
  X, 
  MessageSquare, 
  ChevronDown,
  ChevronUp,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  useAdminTickets,
  useUpdateTicketStatus,
  useAssignTicket,
  useOpenTicketsCount,
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  type TicketStatus,
  type TicketCategory,
  type SupportTicket,
} from "@/hooks/useSupportTickets";
import { useOpenDisputesCount } from "@/hooks/useCashbackDisputes";
import { TicketStatusBadge } from "@/components/support/TicketStatusBadge";
import { TicketCategoryBadge } from "@/components/support/TicketCategoryBadge";
import { TicketMessageThread } from "@/components/support/TicketMessageThread";
import { useTicketDetails } from "@/hooks/useSupportTickets";
import { DisputesManager } from "./DisputesManager";

export function SupportManager() {
  const [activeTab, setActiveTab] = useState("tickets");
  const { data: openTicketsCount } = useOpenTicketsCount();
  const { data: openDisputesCount } = useOpenDisputesCount();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Tickets
            {(openTicketsCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-1">{openTicketsCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Disputes
            {(openDisputesCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-1">{openDisputesCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          <TicketsPanel />
        </TabsContent>

        <TabsContent value="disputes" className="mt-6">
          <DisputesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketsPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const { data: tickets, isLoading } = useAdminTickets({
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    search: search || undefined,
  });

  const { data: openCount } = useOpenTicketsCount();

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const hasFilters = search || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{openCount || 0}</div>
            <p className="text-sm text-muted-foreground">Open Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tickets?.filter(t => t.status === 'in_progress').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tickets?.filter(t => t.status === 'resolved').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tickets?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Tickets
            {(openCount || 0) > 0 && (
              <Badge variant="destructive">{openCount} open</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by subject, user email, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {TICKET_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as TicketCategory | "all")}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TICKET_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !tickets || tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">
                No tickets found
              </p>
              <p className="text-sm text-muted-foreground">
                {hasFilters ? "Try adjusting your filters" : "Support tickets will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket as SupportTicket & { user_email?: string; user_name?: string }}
                  isExpanded={expandedTicketId === ticket.id}
                  onToggle={() => setExpandedTicketId(
                    expandedTicketId === ticket.id ? null : ticket.id
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TicketRow({
  ticket,
  isExpanded,
  onToggle,
}: {
  ticket: SupportTicket & { user_email?: string; user_name?: string };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();
  const { data: ticketDetails, isLoading: detailsLoading } = useTicketDetails(
    isExpanded ? ticket.id : undefined
  );

  const handleStatusChange = (status: TicketStatus) => {
    updateStatus.mutate({ ticketId: ticket.id, status });
  };

  const handleAssign = () => {
    assignTicket.mutate({ ticketId: ticket.id });
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="rounded-lg border">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <TicketStatusBadge status={ticket.status} />
                <TicketCategoryBadge category={ticket.category} showIcon={false} />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </span>
              </div>
              <h4 className="font-medium truncate">{ticket.subject}</h4>
              <p className="text-sm text-muted-foreground truncate">
                {ticket.user_name || 'Unknown'} • {ticket.user_email || 'No email'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-4">
            {/* Description */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {ticket.status === 'open' && (
                <Button size="sm" variant="outline" onClick={handleAssign} disabled={assignTicket.isPending}>
                  <UserCheck className="mr-1 h-4 w-4" />
                  Assign to Me
                </Button>
              )}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('resolved')}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Mark Resolved
                </Button>
              )}
              {ticket.status === 'resolved' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('closed')}>
                  <XCircle className="mr-1 h-4 w-4" />
                  Close Ticket
                </Button>
              )}
              <Select
                value={ticket.status}
                onValueChange={(v) => handleStatusChange(v as TicketStatus)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Messages */}
            <div>
              <h4 className="font-medium mb-3">Conversation</h4>
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : ticketDetails ? (
                <TicketMessageThread
                  ticketId={ticket.id}
                  messages={ticketDetails.messages}
                  ticketStatus={ticket.status}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load messages</p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
