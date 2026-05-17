import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  ChevronDown,
  RefreshCw,
  Eye,
  Play,
  AlertCircle,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  usePendingConversions, 
  useAllConversions, 
  useVerifyConversion,
  type PendingConversion,
} from "@/hooks/useConversionVerification";
import { 
  useAdminTrackingClicks, 
  useSimulateConversion,
  type TrackingClickWithDetails,
} from "@/hooks/useTrackingClicks";
import { format } from "date-fns";

export function ConversionsManager() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversion, setSelectedConversion] = useState<PendingConversion | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSimulateDialog, setShowSimulateDialog] = useState(false);
  const [selectedClick, setSelectedClick] = useState<TrackingClickWithDetails | null>(null);
  const [conversionType, setConversionType] = useState<"app_install" | "purchase" | "signup">("app_install");

  const { data: conversions, isLoading: conversionsLoading, refetch } = useAllConversions(
    statusFilter === "all" ? undefined : statusFilter
  );
  const { data: trackingClicks, isLoading: clicksLoading } = useAdminTrackingClicks("clicked");
  const { mutate: verifyConversion, isPending: verifying } = useVerifyConversion();
  const { mutate: simulateConversion, isPending: simulating } = useSimulateConversion();

  const filteredConversions = conversions?.filter(c => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      c.campaign?.title?.toLowerCase().includes(search) ||
      c.campaign?.company?.name?.toLowerCase().includes(search) ||
      c.id.toLowerCase().includes(search)
    );
  });

  const handleVerify = (conversion: PendingConversion) => {
    verifyConversion({ transactionId: conversion.id, action: "verify" });
  };

  const handleReject = () => {
    if (!selectedConversion || !rejectReason.trim()) return;
    verifyConversion({ 
      transactionId: selectedConversion.id, 
      action: "reject",
      reason: rejectReason,
    });
    setShowRejectDialog(false);
    setSelectedConversion(null);
    setRejectReason("");
  };

  const openRejectDialog = (conversion: PendingConversion) => {
    setSelectedConversion(conversion);
    setShowRejectDialog(true);
  };

  const handleSimulate = () => {
    if (!selectedClick) return;
    simulateConversion({ 
      trackingId: selectedClick.tracking_id,
      conversionType,
    });
    setShowSimulateDialog(false);
    setSelectedClick(null);
  };

  const openSimulateDialog = (click: TrackingClickWithDetails) => {
    setSelectedClick(click);
    setShowSimulateDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "auto_verified":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Auto-Verified</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getRiskBadge = (score: number | null) => {
    const riskScore = score || 0;
    if (riskScore >= 70) {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
          <ShieldAlert className="h-3 w-3 mr-1" />
          {riskScore}
        </Badge>
      );
    }
    if (riskScore >= 40) {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
          <ShieldAlert className="h-3 w-3 mr-1" />
          {riskScore}
        </Badge>
      );
    }
    if (riskScore >= 20) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
          {riskScore}
        </Badge>
      );
    }
    return <span className="text-muted-foreground text-sm">{riskScore}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Pending Clicks for Simulation */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Pending Clicks (Simulation)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Users who clicked deals but haven't converted yet. Simulate conversions for testing.
            </p>
          </div>
          <Badge variant="outline" className="ml-2">
            {trackingClicks?.length || 0} pending
          </Badge>
        </CardHeader>
        <CardContent>
          {clicksLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : trackingClicks && trackingClicks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Clicked At</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingClicks.slice(0, 5).map((click) => (
                    <TableRow key={click.id}>
                      <TableCell className="font-mono text-xs">{click.tracking_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {click.campaign?.company?.logo_url && (
                            <img 
                              src={click.campaign.company.logo_url} 
                              alt="" 
                              className="h-6 w-6 rounded-full"
                            />
                          )}
                          <span className="text-sm">{click.campaign?.title || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(click.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(click.expires_at), "MMM d")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSimulateDialog(click)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Simulate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pending clicks to simulate</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversions Table */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Conversion Verifications</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {conversionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filteredConversions && filteredConversions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Hold Until</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversions.map((conversion) => (
                    <TableRow key={conversion.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {conversion.campaign?.company?.logo_url && (
                            <img 
                              src={conversion.campaign.company.logo_url} 
                              alt="" 
                              className="h-8 w-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm">{conversion.campaign?.title || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {conversion.campaign?.company?.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        ₹{conversion.amount}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {getRiskBadge(conversion.risk_score)}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Fraud risk score (0-100)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {(conversion.fraud_flags_count || 0) > 0 ? (
                          <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500/30">
                            <Flag className="h-3 w-3" />
                            {conversion.fraud_flags_count}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(conversion.verification_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(conversion.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {conversion.hold_until 
                          ? format(new Date(conversion.hold_until), "MMM d, yyyy")
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {conversion.verification_status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleVerify(conversion)}
                              disabled={verifying}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openRejectDialog(conversion)}
                              disabled={verifying}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : conversion.verification_status === "rejected" ? (
                          <span className="text-xs text-muted-foreground">
                            {conversion.rejection_reason || "Rejected"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {conversion.verified_at 
                              ? `Verified ${format(new Date(conversion.verified_at), "MMM d")}`
                              : "Processed"
                            }
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No conversions found</p>
              <p className="text-sm">Conversions will appear here when users complete deals</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Conversion</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this conversion. This will be recorded for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || verifying}
            >
              Reject Conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulate Dialog */}
      <Dialog open={showSimulateDialog} onOpenChange={setShowSimulateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simulate Conversion</DialogTitle>
            <DialogDescription>
              Simulate a conversion for testing. This will create a pending cashback transaction as if the user completed the action.
            </DialogDescription>
          </DialogHeader>
          {selectedClick && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tracking ID</p>
                <p className="font-mono">{selectedClick.tracking_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Conversion Type</label>
                <Select value={conversionType} onValueChange={(v: "app_install" | "purchase" | "signup") => setConversionType(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app_install">App Install</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="signup">Signup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSimulateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSimulate} disabled={simulating}>
              <Play className="h-4 w-4 mr-2" />
              Simulate Conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
