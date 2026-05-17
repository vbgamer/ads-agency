import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Clock,
  Play,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useAutoVerifyLogs,
  useAutoVerifyStats,
  useManualTriggerAutoVerify,
  usePendingAutoVerifyTransactions,
  type AutoVerifyLog,
  type PendingTransaction,
} from "@/hooks/useScheduledJobs";

function getNextRunTime(): Date {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCHours(2, 0, 0, 0);
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  return nextRun;
}

function getStatusBadge(log: AutoVerifyLog) {
  if (log.error_message) {
    return <Badge variant="destructive">Failed</Badge>;
  }
  const payload = log.payload;
  if (payload?.failed_count && payload.failed_count > 0) {
    return <Badge variant="warning">Partial</Badge>;
  }
  if (log.processed) {
    return <Badge variant="default" className="bg-success text-success-foreground">Success</Badge>;
  }
  return <Badge variant="secondary">Unknown</Badge>;
}

export function SchedulerManager() {
  const [dryRunDialogOpen, setDryRunDialogOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useAutoVerifyLogs(50);
  const stats = useAutoVerifyStats();
  const { data: pendingTransactions } = usePendingAutoVerifyTransactions();
  const triggerMutation = useManualTriggerAutoVerify();

  const nextRun = getNextRunTime();
  const lastRun = logs?.[0];

  const handleRunNow = () => {
    triggerMutation.mutate({ batchSize: 100, dryRun: false });
  };

  const handleDryRun = () => {
    triggerMutation.mutate({ batchSize: 100, dryRun: true });
    setDryRunDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Runs
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalRuns}</p>
            <p className="text-xs text-muted-foreground">Last 100 executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.successRate}%</p>
            <p className="text-xs text-muted-foreground">
              {stats.successfulRuns} successful runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Verified
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalVerified}</p>
            <p className="text-xs text-muted-foreground">Transactions auto-verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalFailed}</p>
            <p className="text-xs text-muted-foreground">Failed verifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Job Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Scheduled Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Auto-Verify Conversions</h3>
                  <Badge variant="default" className="bg-success text-success-foreground">
                    Active
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Daily at 2:00 AM UTC
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Next run: {formatDistanceToNow(nextRun, { addSuffix: true })}
                  </span>
                </div>
                {lastRun && (
                  <p className="text-xs text-muted-foreground">
                    Last run: {format(new Date(lastRun.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDryRun}
                  disabled={triggerMutation.isPending}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Dry Run
                </Button>
                <Button
                  size="sm"
                  onClick={handleRunNow}
                  disabled={triggerMutation.isPending}
                >
                  {triggerMutation.isPending && !triggerMutation.variables?.dryRun ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-1 h-4 w-4" />
                  )}
                  Run Now
                </Button>
              </div>
            </div>

            {pendingTransactions && pendingTransactions.length > 0 && (
              <div className="mt-4 rounded-md bg-warning/10 p-3">
                <p className="text-sm font-medium text-warning">
                  {pendingTransactions.length} transaction(s) ready for auto-verification
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Execution History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No execution history</p>
              <p className="text-sm text-muted-foreground">
                Auto-verification runs will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Processed</TableHead>
                  <TableHead className="text-center">Verified</TableHead>
                  <TableHead className="text-center">Failed</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const payload = log.payload;
                  const hasErrors = payload?.errors && payload.errors.length > 0;

                  return (
                    <Collapsible
                      key={log.id}
                      open={expandedLogId === log.id}
                      onOpenChange={(open) => setExpandedLogId(open ? log.id : null)}
                      asChild
                    >
                      <>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {format(new Date(log.created_at), "MMM d, h:mm a")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(log)}</TableCell>
                          <TableCell className="text-center">
                            {payload?.processed_count ?? "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-success font-medium">
                              {payload?.verified_count ?? "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={payload?.failed_count ? "text-destructive font-medium" : ""}>
                              {payload?.failed_count ?? "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {(hasErrors || log.error_message) && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <AlertCircle className="mr-1 h-4 w-4 text-warning" />
                                  View
                                </Button>
                              </CollapsibleTrigger>
                            )}
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={6}>
                              <div className="py-2">
                                {log.error_message && (
                                  <div className="mb-2 rounded-md bg-destructive/10 p-3">
                                    <p className="text-sm font-medium text-destructive">
                                      Error: {log.error_message}
                                    </p>
                                  </div>
                                )}
                                {hasErrors && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Failed Transactions:</p>
                                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                                      {payload?.errors?.map((err, i) => (
                                        <li key={i}>
                                          <code className="text-xs">{err.transaction_id}</code>:{" "}
                                          {err.error}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dry Run Preview Dialog */}
      <Dialog open={dryRunDialogOpen} onOpenChange={setDryRunDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Dry Run Preview
            </DialogTitle>
            <DialogDescription>
              These transactions would be auto-verified if you run the job now.
            </DialogDescription>
          </DialogHeader>

          {triggerMutation.isPending && triggerMutation.variables?.dryRun ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : triggerMutation.data?.would_verify ? (
            <div className="max-h-[400px] overflow-y-auto">
              {triggerMutation.data.would_verify.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="mb-2 h-10 w-10 text-success" />
                  <p className="font-medium">No pending transactions</p>
                  <p className="text-sm text-muted-foreground">
                    All eligible transactions have been verified
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Hold Until</TableHead>
                      <TableHead>Days Past</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triggerMutation.data.would_verify.map((tx: PendingTransaction) => {
                      const holdDate = new Date(tx.hold_until);
                      const daysPast = Math.floor(
                        (Date.now() - holdDate.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium">
                            ₹{Number(tx.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>{tx.campaign?.title || tx.campaign_id}</TableCell>
                          <TableCell>{format(holdDate, "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{daysPast} days</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDryRunDialogOpen(false)}>
              Close
            </Button>
            {triggerMutation.data?.would_verify && triggerMutation.data.would_verify.length > 0 && (
              <Button
                onClick={() => {
                  setDryRunDialogOpen(false);
                  handleRunNow();
                }}
              >
                <Play className="mr-1 h-4 w-4" />
                Proceed with Verification
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
