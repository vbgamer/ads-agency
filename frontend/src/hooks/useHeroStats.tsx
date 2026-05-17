import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHeroStats() {
  return useQuery({
    queryKey: ['hero-stats'],
    queryFn: async () => {
      // Count partner brands (companies)
      const { count: brandsCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Sum verified cashback
      const { data: cashbackData } = await supabase
        .from('cashback_transactions')
        .select('amount')
        .eq('verification_status', 'verified');

      const totalCashback = cashbackData?.reduce(
        (sum, tx) => sum + Number(tx.amount), 0
      ) ?? 0;

      // Count total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Count active campaigns
      const { count: activeCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      return {
        partnerBrands: brandsCount ?? 0,
        cashbackPaid: totalCashback,
        totalUsers: usersCount ?? 0,
        activeDeals: activeCampaigns ?? 0
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
