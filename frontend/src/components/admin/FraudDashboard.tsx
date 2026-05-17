import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Flag, 
  ShieldAlert, 
  ShieldCheck,
  RefreshCw,
  Settings2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useFraudStats, 
  useFraudQueue,
  useFraudFlags,
  useResolveFraudFlag,
} from "@/hooks/useFraudPrevention";
import { useVerifyConversion } from "@/hooks/useConversionVerification";
import { FraudRulesEditor } from "./FraudRulesEditor";
import { FraudSettingsPanel } from "./FraudSettingsPanel";
import { FraudAnalytics } from "./FraudAnalytics";
import { format } from "date-fns";

export function FraudDashboard() {
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [showFlagsDialog, setShowFlagsDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [transactionToReject, setTransactionToReject] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useFraudStats();
  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useFraudQueue();
  const { data: flags, isLoading: flagsLoading } = useFraudFlags(selectedTransaction || undefined);
  const { mutate: resolveFlag, isPending: resolving } = useResolveFraudFlag();
  const { mutate: verifyConversion, isPending: verifying } = useVerifyConversion();

  const getRiskBadge = (score: number) => {
    if (score >= 70) {
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Critical ({score})</Badge>;
    }
    if (score >= 40) {
      return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">High ({score})</Badge>;
    }
    if (score >= 20) {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Medium ({score})</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Low ({score})</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const openFlagsDialog = (transactionId: string) => {
    setSelectedTransaction(transactionId);
    setShowFlagsDialog(true);
  };

  const handleVerify = (transactionId: string) => {
    verifyConversion({ transactionId, action: "verify" });
  };

  const openRejectDialog = (transactionId: string) => {
    setTransactionToReject(transactionId);
    setShowRejectDialog(true);
  };

  const handleReject = () => {
    if (!transactionToReject || !rejectReason.trim()) return;
    verifyConversion({ 
      transactionId: transactionToReject, 
      action: "reject",
      reason: rejectReason,
    });
    setShowRejectDialog(false);
    setTransactionToReject(null);
    setRejectReason("");
  };

  const handleRefresh = () => {
    refetchStats();
    refetchQueue();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Flagged Transactions
                  </CardTitle>
                  <Flag className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalFlagged || 0}</p>
                  <p className="text-sm text-muted-foreground">Total with flags</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    High Risk
                  </CardTitle>
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.highRisk || 0}</p>
                  <p className="text-sm text-muted-foreground">Score 40-69</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Critical Risk
                  </CardTitle>
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.criticalRisk || 0}</p>
                  <p className="text-sm text-muted-foreground">Score 70+</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Auto-Rejected
                  </CardTitle>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.autoRejected || 0}</p>
                  <p className="text-sm text-muted-foreground">By fraud rules</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Tabs for Queue, Rules, Settings, Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="queue" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Fraud</span> Queue
              {(stats?.unresolvedFlags || 0) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {stats?.unresolvedFlags}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <TabsContent value="queue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Transactions Requiring Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : queue && queue.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Hold Until</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queue.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.campaign?.company?.logo_url && (
                              <img 
                                src={tx.campaign.company.logo_url} 
                                alt="" 
                                className="h-8 w-8 rounded-full"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{tx.campaign?.title || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {tx.campaign?.company?.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          ₹{tx.amount}
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(tx.risk_score || 0)}
                        </TableCell>
                        <TableCell>
                          {(tx.fraud_flags_count || 0) > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openFlagsDialog(tx.id)}
                              className="gap-1"
                            >
                              <Flag className="h-3 w-3 text-yellow-500" />
                              {tx.fraud_flags_count} flags
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tx.hold_until 
                            ? format(new Date(tx.hold_until), "MMM d, yyyy")
                            : "-"
                          }
                          {tx.extended_hold_until && (
                            <span className="text-xs text-orange-500 block">Extended</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleVerify(tx.id)}
                              disabled={verifying}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openRejectDialog(tx.id)}
                              disabled={verifying}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No flagged transactions</p>
                  <p className="text-sm">All transactions are within normal risk levels</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <FraudAnalytics />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <FraudRulesEditor />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <FraudSettingsPanel />
        </TabsContent>
      </Tabs>

      {/* Flags Detail Dialog */}
      <Dialog open={showFlagsDialog} onOpenChange={setShowFlagsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fraud Flags</DialogTitle>
            <DialogDescription>
              Detailed breakdown of fraud indicators for this transaction
            </DialogDescription>
          </DialogHeader>
          {flagsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : flags && flags.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {flags.map((flag) => (
                <div 
                  key={flag.id} 
                  className={`p-4 rounded-lg border ${
                    flag.resolved 
                      ? 'bg-muted/50 border-muted' 
                      : 'bg-yellow-500/5 border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{flag.rule?.name || flag.flag_type}</p>
                        {getSeverityBadge(flag.severity)}
                        {flag.resolved && (
                          <Badge variant="secondary">Resolved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {flag.rule?.description || `Flag type: ${flag.flag_type}`}
                      </p>
                      {flag.details && (
                        <div className="mt-2 text-xs bg-secondary/50 p-2 rounded font-mono">
                          {Object.entries(flag.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-muted-foreground">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {!flag.resolved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resolveFlag({ flagId: flag.id })}
                        disabled={resolving}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No flags found</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this transaction. This will be recorded for audit purposes.
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
              Reject Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
