import { format } from "date-fns";
import { ArrowLeft, Loader2, Calendar, Package, IndianRupee, FileText, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useDisputeDetails } from "@/hooks/useCashbackDisputes";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { DisputeTypeBadge } from "./DisputeTypeBadge";

interface DisputeDetailProps {
  disputeId: string;
  onBack: () => void;
}

export function DisputeDetail({ disputeId, onBack }: DisputeDetailProps) {
  const { data: dispute, isLoading } = useDisputeDetails(disputeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Dispute not found</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Dispute Details</h2>
          <p className="text-sm text-muted-foreground">
            Submitted {format(new Date(dispute.created_at), "PPP")}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <DisputeStatusBadge status={dispute.status} />
              <DisputeTypeBadge type={dispute.dispute_type} />
            </div>
            {dispute.status === "resolved" && dispute.resolution_amount && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">₹{dispute.resolution_amount} credited</span>
              </div>
            )}
            {dispute.status === "rejected" && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Claim rejected</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brand / Store</p>
                <p className="font-medium">{dispute.brand_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transaction Date</p>
                <p className="font-medium">{format(new Date(dispute.transaction_date), "PPP")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="font-medium font-mono">{dispute.order_id}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IndianRupee className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected vs Received</p>
                <p className="font-medium">
                  ₹{dispute.expected_amount} expected, ₹{dispute.actual_amount} received
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
            <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
              {dispute.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resolution Details (if resolved/rejected) */}
      {(dispute.status === "resolved" || dispute.status === "rejected") && dispute.resolution_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dispute.resolved_at && (
              <p className="text-sm text-muted-foreground">
                Resolved on {format(new Date(dispute.resolved_at), "PPP 'at' p")}
              </p>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</p>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                {dispute.resolution_notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline hint for pending disputes */}
      {(dispute.status === "open" || dispute.status === "under_review") && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>What happens next?</strong> Our team will review your dispute and verify the transaction details. 
              You'll receive an update once we've completed our investigation, typically within 3-5 business days.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
