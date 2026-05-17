import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceStats {
  views: number;
  reactions: number;
  conversions: number;
  cashbackDistributed: number;
  uniqueUsers: number;
}

interface ReactionBreakdown {
  impressed: number;
  relatable: number;
  decent: number;
  boring: number;
}

interface ActivityLog {
  id: string;
  event_type: string;
  user_id: string | null;
  created_at: string;
  user_name?: string;
  location_city?: string;
  location_state?: string;
}

interface DemographicData {
  age_groups: { label: string; count: number }[];
  gender_distribution: { label: string; count: number }[];
  top_locations: { city: string; state: string; count: number }[];
}

// Fetch campaign performance stats
export const useCampaignPerformanceStats = (campaignId: string) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    const fetchStats = async () => {
      try {
        // Get views count
        const { count: viewsCount } = await supabase
          .from('campaign_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'view');

        // Get reactions count
        const { count: reactionsCount } = await supabase
          .from('campaign_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId);

        // Get conversions count
        const { count: conversionsCount } = await supabase
          .from('campaign_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'conversion');

        // Get cashback distributed
        const { data: cashbackData } = await supabase
          .from('cashback_transactions')
          .select('amount')
          .eq('campaign_id', campaignId);

        const totalCashback = cashbackData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        // Get unique users
        const { data: uniqueData } = await supabase
          .from('campaign_analytics')
          .select('user_id')
          .eq('campaign_id', campaignId)
          .not('user_id', 'is', null);

        const uniqueUsers = new Set(uniqueData?.map(d => d.user_id)).size;

        setStats({
          views: viewsCount || 0,
          reactions: reactionsCount || 0,
          conversions: conversionsCount || 0,
          cashbackDistributed: totalCashback,
          uniqueUsers,
        });
      } catch (error) {
        console.error('Error fetching performance stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [campaignId]);

  return { stats, isLoading };
};

// Fetch reaction breakdown
export const useCampaignReactionBreakdown = (campaignId: string) => {
  const [breakdown, setBreakdown] = useState<ReactionBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    const fetchBreakdown = async () => {
      try {
        const { data } = await supabase
          .from('campaign_reactions')
          .select('reaction')
          .eq('campaign_id', campaignId);

        const counts: ReactionBreakdown = {
          impressed: 0,
          relatable: 0,
          decent: 0,
          boring: 0,
        };

        data?.forEach(r => {
          if (r.reaction in counts) {
            counts[r.reaction as keyof ReactionBreakdown]++;
          }
        });

        setBreakdown(counts);
      } catch (error) {
        console.error('Error fetching reaction breakdown:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreakdown();
  }, [campaignId]);

  return { breakdown, isLoading };
};

// Fetch activity log with pagination
export const useCampaignActivityLog = (campaignId: string, page: number = 0, pageSize: number = 20) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
          .from('campaign_analytics')
          .select(`
            id,
            event_type,
            user_id,
            created_at,
            location_city,
            location_state
          `)
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        // Fetch user names for logged-in users
        const userIds = data?.filter(d => d.user_id).map(d => d.user_id) || [];
        const userNames: Record<string, string> = {};

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);

          profiles?.forEach(p => {
            userNames[p.id] = p.name;
          });
        }

        const activitiesWithNames = data?.map(a => ({
          ...a,
          user_name: a.user_id ? userNames[a.user_id] || 'Anonymous' : 'Guest',
        })) || [];

        setActivities(prev => page === 0 ? activitiesWithNames : [...prev, ...activitiesWithNames]);
        setHasMore((data?.length || 0) === pageSize);
      } catch (error) {
        console.error('Error fetching activity log:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [campaignId, page, pageSize]);

  return { activities, isLoading, hasMore };
};

// Fetch user demographics
export const useCampaignDemographics = (campaignId: string) => {
  const [demographics, setDemographics] = useState<DemographicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    const fetchDemographics = async () => {
      try {
        // Get unique user IDs who interacted
        const { data: analyticsData } = await supabase
          .from('campaign_analytics')
          .select('user_id')
          .eq('campaign_id', campaignId)
          .not('user_id', 'is', null);

        const userIds = [...new Set(analyticsData?.map(d => d.user_id))];

        if (userIds.length === 0) {
          setDemographics({
            age_groups: [],
            gender_distribution: [],
            top_locations: [],
          });
          setIsLoading(false);
          return;
        }

        // Fetch user profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('age, gender, city, state')
          .in('id', userIds);

        // Process age groups
        const ageGroups: Record<string, number> = {};
        const genderDist: Record<string, number> = {};
        const locationCounts: Record<string, { city: string; state: string; count: number }> = {};

        profiles?.forEach(p => {
          // Age groups
          if (p.age) {
            ageGroups[p.age] = (ageGroups[p.age] || 0) + 1;
          }

          // Gender distribution
          if (p.gender) {
            const gender = p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase();
            genderDist[gender] = (genderDist[gender] || 0) + 1;
          }

          // Locations
          if (p.city && p.state) {
            const key = `${p.city}-${p.state}`;
            if (!locationCounts[key]) {
              locationCounts[key] = { city: p.city, state: p.state, count: 0 };
            }
            locationCounts[key].count++;
          }
        });

        setDemographics({
          age_groups: Object.entries(ageGroups).map(([label, count]) => ({ label, count })),
          gender_distribution: Object.entries(genderDist).map(([label, count]) => ({ label, count })),
          top_locations: Object.values(locationCounts).sort((a, b) => b.count - a.count).slice(0, 5),
        });
      } catch (error) {
        console.error('Error fetching demographics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemographics();
  }, [campaignId]);

  return { demographics, isLoading };
};
