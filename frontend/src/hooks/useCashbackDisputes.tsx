import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type DisputeType = "missing_cashback" | "incorrect_amount" | "delayed_cashback" | "rejected_cashback";
export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface CashbackDispute {
  id: string;
  user_id: string;
  transaction_id: string | null;
  brand_name: string;
  transaction_date: string;
  order_id: string;
  expected_amount: number;
  actual_amount: number;
  dispute_type: DisputeType;
  description: string;
  screenshot_url: string | null;
  status: DisputeStatus;
  resolution_notes: string | null;
  resolution_amount: number | null;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const DISPUTE_TYPES = [
  { value: "missing_cashback" as const, label: "Missing Cashback" },
  { value: "incorrect_amount" as const, label: "Incorrect Amount" },
  { value: "delayed_cashback" as const, label: "Delayed Cashback" },
  { value: "rejected_cashback" as const, label: "Rejected Cashback" },
];

export const DISPUTE_STATUSES = [
  { value: "open" as const, label: "Open" },
  { value: "under_review" as const, label: "Under Review" },
  { value: "resolved" as const, label: "Resolved" },
  { value: "rejected" as const, label: "Rejected" },
];

// User hooks
export function useUserDisputes() {
  return useQuery({
    queryKey: ["user-disputes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("cashback_disputes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CashbackDispute[];
    },
  });
}

export function useDisputeDetails(disputeId: string | undefined) {
  return useQuery({
    queryKey: ["dispute-details", disputeId],
    queryFn: async () => {
      if (!disputeId) throw new Error("No dispute ID provided");

      const { data, error } = await supabase
        .from("cashback_disputes")
        .select("*")
        .eq("id", disputeId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Dispute not found");
      return data as CashbackDispute;
    },
    enabled: !!disputeId,
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dispute: {
      brand_name: string;
      transaction_date: string;
      order_id: string;
      expected_amount: number;
      actual_amount: number;
      dispute_type: DisputeType;
      description: string;
      transaction_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("cashback_disputes")
        .insert({
          user_id: user.id,
          brand_name: dispute.brand_name,
          transaction_date: dispute.transaction_date,
          order_id: dispute.order_id,
          expected_amount: dispute.expected_amount,
          actual_amount: dispute.actual_amount,
          dispute_type: dispute.dispute_type,
          description: dispute.description,
          transaction_id: dispute.transaction_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["open-disputes-count"] });
      toast({
        title: "Dispute submitted",
        description: "We'll review your dispute and get back to you soon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Admin hooks
export function useAdminDisputes(filters?: {
  status?: DisputeStatus;
  dispute_type?: DisputeType;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin-disputes", filters],
    queryFn: async () => {
      let query = supabase
        .from("cashback_disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.dispute_type) {
        query = query.eq("dispute_type", filters.dispute_type);
      }

      if (filters?.search) {
        query = query.or(`brand_name.ilike.%${filters.search}%,order_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CashbackDispute[];
    },
  });
}

export function useUpdateDisputeStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      disputeId,
      status,
    }: {
      disputeId: string;
      status: DisputeStatus;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "under_review") {
        updates.assigned_to = user.id;
      }

      const { error } = await supabase
        .from("cashback_disputes")
        .update(updates)
        .eq("id", disputeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["open-disputes-count"] });
      toast({
        title: "Status updated",
        description: "Dispute status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      disputeId,
      status,
      resolution_notes,
      resolution_amount,
    }: {
      disputeId: string;
      status: "resolved" | "rejected";
      resolution_notes: string;
      resolution_amount?: number;
    }) => {
      const { error } = await supabase
        .from("cashback_disputes")
        .update({
          status,
          resolution_notes,
          resolution_amount: resolution_amount || null,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["user-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["open-disputes-count"] });
      queryClient.invalidateQueries({ queryKey: ["dispute-details"] });
      toast({
        title: variables.status === "resolved" ? "Dispute resolved" : "Dispute rejected",
        description: "The dispute has been processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useOpenDisputesCount() {
  return useQuery({
    queryKey: ["open-disputes-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("cashback_disputes")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "under_review"]);

      if (error) throw error;
      return count || 0;
    },
  });
}
