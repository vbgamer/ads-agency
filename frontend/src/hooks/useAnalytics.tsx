import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CampaignStats {
  total_clicks: number;
  total_conversions: number;
  unique_users: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  monthlyPayouts: number;
  pendingReviews: number;
}

export function useCampaignStats() {
  const { user, company } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['campaign-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total_clicks: 0, total_conversions: 0, unique_users: 0 };

      // Get aggregate stats from campaign_analytics
      const { data, error } = await supabase
        .from('campaign_analytics')
        .select('event_type, user_id, campaign_id')
        .in('campaign_id', 
          (await supabase
            .from('campaigns')
            .select('id')
            .eq('company_id', user.id)
          ).data?.map(c => c.id) ?? []
        );

      if (error) throw error;

      const clicks = data?.filter(e => e.event_type === 'click').length ?? 0;
      const conversions = data?.filter(e => e.event_type === 'conversion').length ?? 0;
      const uniqueUsers = new Set(data?.map(e => e.user_id)).size;

      return {
        total_clicks: clicks,
        total_conversions: conversions,
        unique_users: uniqueUsers,
      } as CampaignStats;
    },
    enabled: !!user?.id && !!company,
  });

  return { stats, isLoading, error };
}

export function useConsumerDemographics() {
  const { user, company } = useAuth();

  const { data: demographics, isLoading, error } = useQuery({
    queryKey: ['consumer-demographics', user?.id],
    queryFn: async () => {
      if (!user?.id) return { ageDistribution: [], genderDistribution: [] };

      // Get user profiles who interacted with company's campaigns
      const { data: analyticsData } = await supabase
        .from('campaign_analytics')
        .select('user_id')
        .in('campaign_id', 
          (await supabase
            .from('campaigns')
            .select('id')
            .eq('company_id', user.id)
          ).data?.map(c => c.id) ?? []
        );

      const userIds = [...new Set(analyticsData?.map(a => a.user_id).filter(Boolean))];
      
      if (userIds.length === 0) {
        return { ageDistribution: [], genderDistribution: [] };
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('age, gender')
        .in('id', userIds);

      // Calculate age distribution
      const ageGroups: Record<string, number> = {};
      const genderGroups: Record<string, number> = {};

      profiles?.forEach(p => {
        if (p.age) {
          const age = parseInt(p.age);
          const group = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : '45+';
          ageGroups[group] = (ageGroups[group] || 0) + 1;
        }
        if (p.gender) {
          genderGroups[p.gender] = (genderGroups[p.gender] || 0) + 1;
        }
      });

      return {
        ageDistribution: Object.entries(ageGroups).map(([age, value]) => ({ age, value })),
        genderDistribution: Object.entries(genderGroups).map(([gender, value]) => ({ gender, value })),
      };
    },
    enabled: !!user?.id && !!company,
  });

  return { demographics, isLoading, error };
}

export function useTopLocations() {
  const { user, company } = useAuth();

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['top-locations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('campaign_analytics')
        .select('location_city, location_state')
        .in('campaign_id', 
          (await supabase
            .from('campaigns')
            .select('id')
            .eq('company_id', user.id)
          ).data?.map(c => c.id) ?? []
        )
        .not('location_city', 'is', null);

      // Count by city
      const locationCounts: Record<string, number> = {};
      data?.forEach(l => {
        const key = `${l.location_city}, ${l.location_state}`;
        locationCounts[key] = (locationCounts[key] || 0) + 1;
      });

      return Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    enabled: !!user?.id && !!company,
  });

  return { locations: locations ?? [], isLoading, error };
}

export function useAdminStats() {
  const { isAdmin } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total companies
      const { count: companyCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Get monthly payouts (sum of approved cashback transactions this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: payoutsData } = await supabase
        .from('cashback_transactions')
        .select('amount')
        .eq('status', 'approved')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyPayouts = payoutsData?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      // Get pending company verifications
      const { count: pendingReviews } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false);

      return {
        totalUsers: userCount ?? 0,
        totalCompanies: companyCount ?? 0,
        monthlyPayouts,
        pendingReviews: pendingReviews ?? 0,
      } as AdminStats;
    },
    enabled: isAdmin,
  });

  return { stats, isLoading, error };
}

export function useAdminUsers() {
  const { isAdmin } = useAuth();

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  return { users: users ?? [], isLoading, error, refetch };
}

export function useAdminCompanies() {
  const { isAdmin } = useAuth();

  const { data: companies, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  return { companies: companies ?? [], isLoading, error, refetch };
}
