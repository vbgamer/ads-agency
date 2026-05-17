import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: "pending" | "converted" | "rewarded";
  referred_reward: number;
  converted_at: string | null;
  rewarded_at: string | null;
  created_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  availableDiscounts: number;
  totalEarned: number;
}

// Fetch or generate user's referral code
export function useReferralCode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First check if user already has a code
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profile?.referral_code) {
        return profile.referral_code;
      }

      // Generate new code using RPC
      const { data, error } = await supabase.rpc("generate_user_referral_code", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as string;
    },
    enabled: !!user,
  });
}

// Get referral statistics
export function useReferralStats() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get referrals where current user is the referrer
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id);

      if (error) throw error;

      const totalReferrals = referrals?.length || 0;
      const pendingReferrals = referrals?.filter((r) => r.status === "pending").length || 0;
      const convertedReferrals = referrals?.filter((r) => r.status === "rewarded").length || 0;
      const availableDiscounts = profile?.referral_discounts_available || 0;
      const totalEarned = convertedReferrals * 50; // ₹50 per successful referral

      return {
        totalReferrals,
        pendingReferrals,
        convertedReferrals,
        availableDiscounts,
        totalEarned,
      } as ReferralStats;
    },
    enabled: !!user,
  });
}

// Get list of all referrals
export function useReferralList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-list", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!user,
  });
}

// Get available referral discounts count
export function useAvailableDiscounts() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["available-discounts", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Use profile from auth context if available
      if (profile?.referral_discounts_available !== undefined) {
        return profile.referral_discounts_available;
      }

      // Fallback to direct query
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_discounts_available")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data?.referral_discounts_available || 0;
    },
    enabled: !!user,
  });
}

// Record a referral when a new user signs up
export function useRecordReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referredId,
      referralCode,
    }: {
      referredId: string;
      referralCode: string;
    }) => {
      const { data, error } = await supabase.rpc("record_referral", {
        p_referred_id: referredId,
        p_referral_code: referralCode,
      });

      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      queryClient.invalidateQueries({ queryKey: ["referral-list"] });
    },
  });
}
