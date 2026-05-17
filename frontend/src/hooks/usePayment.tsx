import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface PaymentTransaction {
  id: string;
  user_id: string | null;
  company_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  card_last_four: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// Fetch user's payment transactions
export function usePaymentTransactions() {
  return useQuery({
    queryKey: ["payment-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });
}

// Fetch company's payment transactions
export function useCompanyPaymentTransactions() {
  return useQuery({
    queryKey: ["company-payment-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });
}

// Fetch user's subscription
export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
  });
}

// Process subscription payment
export function useProcessSubscriptionPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async ({
      planId,
      amount,
      cardLastFour,
      success,
      errorMessage,
    }: {
      planId: string;
      amount: number;
      cardLastFour: string;
      success: boolean;
      errorMessage?: string;
    }) => {
      // Use secure RPC function that handles all payment processing server-side
      const { data, error } = await supabase.rpc("process_subscription_payment", {
        p_plan_id: planId,
        p_amount: amount,
        p_card_last_four: cardLastFour,
        p_success: success,
        p_error_message: errorMessage || null,
      });

      if (error) throw error;

      const result = data as { success?: boolean } | null;
      return { success: result?.success ?? false };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
      
      if (data.success) {
        // Refresh profile to get updated is_premium status
        await refreshProfile();
        
        toast({
          title: "Subscription activated!",
          description: "Welcome to Premium. Enjoy your benefits!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Process wallet top-up payment
export function useProcessWalletTopup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      amount,
      cardLastFour,
      success,
      errorMessage,
    }: {
      amount: number;
      cardLastFour: string;
      success: boolean;
      errorMessage?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Record the payment transaction
      const { error: txError } = await supabase
        .from("payment_transactions")
        .insert({
          company_id: user.id,
          amount,
          currency: "INR",
          status: success ? "succeeded" : "failed",
          payment_type: "wallet_topup",
          card_last_four: cardLastFour,
          error_message: errorMessage || null,
        });

      if (txError) throw txError;

      if (success) {
        // Add funds to wallet using existing RPC
        const { error: walletError } = await supabase.rpc("add_funds_to_wallet", {
          p_company_id: user.id,
          p_amount: amount,
        });

        if (walletError) throw walletError;
      }

      return { success };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["company-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["company-payment-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      
      if (data.success) {
        toast({
          title: "Funds added!",
          description: "Your wallet has been topped up successfully.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Top-up failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Process donation payment
export function useProcessDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      cardLastFour,
      success,
      errorMessage,
    }: {
      amount: number;
      cardLastFour: string;
      success: boolean;
      errorMessage?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("payment_transactions")
        .insert({
          user_id: user.id,
          amount,
          currency: "INR",
          status: success ? "succeeded" : "failed",
          payment_type: "donation",
          card_last_four: cardLastFour,
          error_message: errorMessage || null,
        });

      if (error) throw error;
      return { success };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["donation-transactions"] });
    },
  });
}

// Fetch user's donation transactions
export function useDonationTransactions() {
  return useQuery({
    queryKey: ["donation-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_type", "donation")
        .eq("status", "succeeded")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });
}

// Fetch user's subscription payment transactions
export function useSubscriptionTransactions() {
  return useQuery({
    queryKey: ["subscription-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_type", "subscription")
        .eq("status", "succeeded")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });
}

// Fetch company's wallet top-up transactions
export function useWalletTopupTransactions() {
  return useQuery({
    queryKey: ["wallet-topup-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("company_id", user.id)
        .eq("payment_type", "wallet_topup")
        .eq("status", "succeeded")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });
}
