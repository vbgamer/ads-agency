import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutoVerifyLog {
  id: string;
  created_at: string;
  source: string;
  endpoint: string;
  tracking_id: string | null;
  processed: boolean;
  signature_valid: boolean;
  error_message: string | null;
  payload: {
    batch_size?: number;
    dry_run?: boolean;
    processed_count?: number;
    verified_count?: number;
    failed_count?: number;
    errors?: Array<{ transaction_id: string; error: string }>;
    transactions?: Array<{
      id: string;
      user_id: string;
      amount: number;
      campaign_id: string;
      hold_until: string;
    }>;
  } | null;
  headers: Record<string, unknown> | null;
}

export interface PendingTransaction {
  id: string;
  user_id: string;
  amount: number;
  campaign_id: string;
  hold_until: string;
  campaign?: {
    title: string;
  } | null;
}

export function useAutoVerifyLogs(limit = 50) {
  return useQuery({
    queryKey: ["auto-verify-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .eq("source", "auto-verify-system")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AutoVerifyLog[];
    },
  });
}

export function useAutoVerifyStats() {
  const { data: logs } = useAutoVerifyLogs(100);

  const stats = {
    totalRuns: logs?.length || 0,
    successfulRuns: logs?.filter((log) => log.processed && !log.error_message)?.length || 0,
    totalVerified: logs?.reduce((acc, log) => {
      const payload = log.payload as AutoVerifyLog["payload"];
      return acc + (payload?.verified_count || 0);
    }, 0) || 0,
    totalFailed: logs?.reduce((acc, log) => {
      const payload = log.payload as AutoVerifyLog["payload"];
      return acc + (payload?.failed_count || 0);
    }, 0) || 0,
  };

  const successRate = stats.totalRuns > 0 
    ? Math.round((stats.successfulRuns / stats.totalRuns) * 100) 
    : 0;

  return { ...stats, successRate };
}

export function useManualTriggerAutoVerify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchSize = 100, dryRun = false }: { batchSize?: number; dryRun?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("auto-verify-conversions", {
        body: { batch_size: batchSize, dry_run: dryRun },
      });

      if (error) throw error;
      return data as {
        success: boolean;
        dry_run?: boolean;
        would_verify?: PendingTransaction[];
        processed_count?: number;
        verified_count?: number;
        failed_count?: number;
        errors?: Array<{ transaction_id: string; error: string }>;
      };
    },
    onSuccess: (data, variables) => {
      if (variables.dryRun) {
        toast.info(`Dry run complete: ${data.would_verify?.length || 0} transactions would be verified`);
      } else {
        toast.success(
          `Auto-verification complete: ${data.verified_count || 0} verified, ${data.failed_count || 0} failed`
        );
      }
      queryClient.invalidateQueries({ queryKey: ["auto-verify-logs"] });
      queryClient.invalidateQueries({ queryKey: ["pending-conversions"] });
    },
    onError: (error: Error) => {
      toast.error(`Auto-verification failed: ${error.message}`);
    },
  });
}

export function usePendingAutoVerifyTransactions() {
  return useQuery({
    queryKey: ["pending-auto-verify-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback_transactions")
        .select(`
          id,
          user_id,
          amount,
          campaign_id,
          hold_until,
          campaign:campaigns(title)
        `)
        .eq("verification_status", "pending")
        .lt("hold_until", new Date().toISOString())
        .order("hold_until", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as PendingTransaction[];
    },
  });
}
