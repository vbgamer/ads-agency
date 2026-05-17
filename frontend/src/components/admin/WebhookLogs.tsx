import { useState } from "react";
import { format } from "date-fns";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebhookLogs, type WebhookLog } from "@/hooks/useConversionVerification";

export function WebhookLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  const { data: logs, isLoading, refetch } = useWebhookLogs(100);

  const filteredLogs = logs?.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.source.toLowerCase().includes(search) ||
      log.tracking_id?.toLowerCase().includes(search) ||
      log.endpoint.toLowerCase().includes(search) ||
      log.error_message?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (log: WebhookLog) => {
    if (log.processed && log.signature_valid) {
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Processed
        </Badge>
      );
    }
    if (!log.signature_valid) {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Invalid Signature
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      appsflyer: "bg-blue-500/20 text-blue-500",
      impact: "bg-purple-500/20 text-purple-500",
      branch: "bg-green-500/20 text-green-500",
      manual_simulation: "bg-orange-500/20 text-orange-500",
      unknown: "bg-gray-500/20 text-gray-500",
    };
    return (
      <Badge className={colors[source.toLowerCase()] || colors.unknown}>
        {source}
      </Badge>
    );
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Webhook Logs</CardTitle>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filteredLogs && filteredLogs.length > 0 ? (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <Collapsible
                key={log.id}
                open={expandedLog === log.id}
                onOpenChange={(open) => setExpandedLog(open ? log.id : null)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-4 flex-wrap">
                        {getSourceBadge(log.source)}
                        {getStatusBadge(log)}
                        {log.tracking_id && (
                          <code className="text-xs bg-secondary px-2 py-1 rounded">
                            {log.tracking_id}
                          </code>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                        </span>
                      </div>
                      {expandedLog === log.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {log.error_message && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm font-medium text-red-500">Error</p>
                          <p className="text-sm text-red-400">{log.error_message}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Endpoint</p>
                        <code className="text-xs bg-secondary px-2 py-1 rounded block">
                          {log.endpoint}
                        </code>
                      </div>

                      {log.payload && (
                        <div>
                          <p className="text-sm font-medium mb-2">Payload</p>
                          <pre className="text-xs bg-secondary p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.headers && (
                        <div>
                          <p className="text-sm font-medium mb-2">Headers</p>
                          <pre className="text-xs bg-secondary p-3 rounded-lg overflow-x-auto max-h-32">
                            {JSON.stringify(log.headers, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No webhook logs found</p>
            <p className="text-sm">Webhook activity will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
