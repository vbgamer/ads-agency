import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Loader2, AlertCircle, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserDisputes, DISPUTE_STATUSES, type DisputeStatus } from "@/hooks/useCashbackDisputes";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { DisputeTypeBadge } from "./DisputeTypeBadge";

interface DisputeListProps {
  onSelectDispute: (id: string) => void;
}

export function DisputeList({ onSelectDispute }: DisputeListProps) {
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const { data: disputes, isLoading } = useUserDisputes();

  const filteredDisputes = disputes?.filter((dispute) =>
    statusFilter === "all" ? true : dispute.status === statusFilter
  );

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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DisputeStatus | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disputes</SelectItem>
            {DISPUTE_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {!filteredDisputes || filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No disputes found
            </p>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== "all"
                ? "Try changing the filter"
                : "You haven't submitted any cashback disputes yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDisputes.map((dispute) => (
            <Card
              key={dispute.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => onSelectDispute(dispute.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DisputeStatusBadge status={dispute.status} />
                      <DisputeTypeBadge type={dispute.dispute_type} />
                    </div>
                    <h4 className="font-medium truncate">
                      {dispute.brand_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Order #{dispute.order_id} • ₹{dispute.expected_amount} expected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                    </p>
                    {dispute.status === "resolved" && dispute.resolution_amount && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ₹{dispute.resolution_amount} credited
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
