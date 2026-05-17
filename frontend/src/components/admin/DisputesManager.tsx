import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Loader2, 
  Search, 
  X, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  useAdminDisputes,
  useUpdateDisputeStatus,
  useResolveDispute,
  useOpenDisputesCount,
  DISPUTE_TYPES,
  DISPUTE_STATUSES,
  type DisputeStatus,
  type DisputeType,
  type CashbackDispute,
} from "@/hooks/useCashbackDisputes";
import { DisputeStatusBadge } from "@/components/support/DisputeStatusBadge";
import { DisputeTypeBadge } from "@/components/support/DisputeTypeBadge";

export function DisputesManager() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DisputeType | "all">("all");
  const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);

  const { data: disputes, isLoading } = useAdminDisputes({
    status: statusFilter === "all" ? undefined : statusFilter,
    dispute_type: typeFilter === "all" ? undefined : typeFilter,
    search: search || undefined,
  });

  const { data: openCount } = useOpenDisputesCount();

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const hasFilters = search || statusFilter !== "all" || typeFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{openCount || 0}</div>
            <p className="text-sm text-muted-foreground">Open Disputes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {disputes?.filter(d => d.status === 'under_review').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {disputes?.filter(d => d.status === 'resolved').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{disputes?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Disputes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Cashback Disputes
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
                placeholder="Search by brand or order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DisputeStatus | "all")}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {DISPUTE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DisputeType | "all")}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DISPUTE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
          ) : !disputes || disputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">
                No disputes found
              </p>
              <p className="text-sm text-muted-foreground">
                {hasFilters ? "Try adjusting your filters" : "Cashback disputes will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {disputes.map((dispute) => (
                <DisputeRow
                  key={dispute.id}
                  dispute={dispute}
                  isExpanded={expandedDisputeId === dispute.id}
                  onToggle={() => setExpandedDisputeId(
                    expandedDisputeId === dispute.id ? null : dispute.id
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

function DisputeRow({
  dispute,
  isExpanded,
  onToggle,
}: {
  dispute: CashbackDispute;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveAction, setResolveAction] = useState<"resolved" | "rejected">("resolved");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionAmount, setResolutionAmount] = useState<number>(0);

  const updateStatus = useUpdateDisputeStatus();
  const resolveDispute = useResolveDispute();

  const handleStartReview = () => {
    updateStatus.mutate({ disputeId: dispute.id, status: "under_review" });
  };

  const handleOpenResolve = (action: "resolved" | "rejected") => {
    setResolveAction(action);
    setResolutionNotes("");
    setResolutionAmount(action === "resolved" ? dispute.expected_amount : 0);
    setResolveDialogOpen(true);
  };

  const handleResolve = () => {
    resolveDispute.mutate({
      disputeId: dispute.id,
      status: resolveAction,
      resolution_notes: resolutionNotes,
      resolution_amount: resolveAction === "resolved" ? resolutionAmount : undefined,
    });
    setResolveDialogOpen(false);
  };

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="rounded-lg border">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DisputeStatusBadge status={dispute.status} />
                  <DisputeTypeBadge type={dispute.dispute_type} />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                  </span>
                </div>
                <h4 className="font-medium truncate">{dispute.brand_name}</h4>
                <p className="text-sm text-muted-foreground truncate">
                  Order #{dispute.order_id} • ₹{dispute.expected_amount} expected
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
              {/* Transaction Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transaction Date</p>
                  <p className="font-medium">{format(new Date(dispute.transaction_date), "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amounts</p>
                  <p className="font-medium">
                    ₹{dispute.expected_amount} expected, ₹{dispute.actual_amount} received
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{dispute.description}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {dispute.status === 'open' && (
                  <Button size="sm" variant="outline" onClick={handleStartReview} disabled={updateStatus.isPending}>
                    <Eye className="mr-1 h-4 w-4" />
                    Start Review
                  </Button>
                )}
                {(dispute.status === 'open' || dispute.status === 'under_review') && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleOpenResolve("resolved")}>
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve & Credit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleOpenResolve("rejected")}>
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>

              {/* Resolution info if resolved */}
              {(dispute.status === 'resolved' || dispute.status === 'rejected') && dispute.resolution_notes && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">
                    {dispute.status === 'resolved' ? 'Resolution Notes' : 'Rejection Reason'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{dispute.resolution_notes}</p>
                  {dispute.resolution_amount && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
                      ₹{dispute.resolution_amount} credited
                    </p>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolveAction === "resolved" ? "Approve & Credit Dispute" : "Reject Dispute"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {resolveAction === "resolved" && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Credit (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  max={dispute.expected_amount}
                  value={resolutionAmount}
                  onChange={(e) => setResolutionAmount(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  User expected ₹{dispute.expected_amount}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">
                {resolveAction === "resolved" ? "Resolution Notes" : "Rejection Reason"}*
              </Label>
              <Textarea
                id="notes"
                placeholder={resolveAction === "resolved" 
                  ? "Explain the resolution..."
                  : "Explain why the dispute is being rejected..."
                }
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResolve} 
              disabled={!resolutionNotes.trim() || resolveDispute.isPending}
              variant={resolveAction === "rejected" ? "destructive" : "default"}
            >
              {resolveDispute.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resolveAction === "resolved" ? "Approve & Credit" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
