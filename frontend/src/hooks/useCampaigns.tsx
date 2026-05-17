import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { validateCampaignData, formatValidationErrors } from '@/lib/campaignValidation';

export interface Campaign {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  cash_allotment: number;
  category: string | null;
  ad_format: 'landscape' | 'reel' | 'display' | null;
  image_url: string | null;
  video_url: string | null;
  destination_url: string;
  start_date: string;
  end_date: string;
  code: string | null;
  reward_hold_days: number;
  status: 'draft' | 'active' | 'paused' | 'expired';
  clicks: number;
  conversions: number;
  created_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    cover_url: string | null;
  };
}

export type CampaignInput = Omit<Campaign, 'id' | 'created_at' | 'company' | 'clicks' | 'conversions'>;

export function useCompanyCampaigns() {
  const { user, company } = useAuth();

  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['company-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user?.id && !!company,
  });

  const activeCampaigns = campaigns?.filter(c => {
    const today = new Date().toISOString().split('T')[0];
    return c.status === 'active' && c.start_date <= today && c.end_date >= today;
  }) ?? [];

  const expiredCampaigns = campaigns?.filter(c => {
    const today = new Date().toISOString().split('T')[0];
    return c.status === 'expired' || c.end_date < today;
  }) ?? [];

  return {
    campaigns: campaigns ?? [],
    activeCampaigns,
    expiredCampaigns,
    isLoading,
    error,
    refetch,
  };
}

export function useActiveCampaigns() {
  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['active-campaigns'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          company:companies(id, name, logo_url, cover_url)
        `)
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  return { campaigns: campaigns ?? [], isLoading, error, refetch };
}

export function useCampaignById(id: string) {
  const { data: campaign, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          company:companies(id, name, logo_url, cover_url)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Campaign | null;
    },
    enabled: !!id,
  });

  return { campaign, isLoading, error, refetch };
}

export function useCampaignMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<CampaignInput, 'company_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Validate campaign data before submission
      const validationResult = validateCampaignData(campaign);
      if (!validationResult.success) {
        const errors = formatValidationErrors(validationResult.error);
        throw new Error(errors.join(', '));
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...campaign,
          company_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-campaigns', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-campaigns'] });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Campaign> }) => {
      // Helper to check if URL is an existing stored URL (not a new upload)
      const isExistingUrl = (url: string | null | undefined): boolean => {
        if (!url) return true;
        // External URLs or already stored URLs don't need size validation
        return url.startsWith('http://') || url.startsWith('https://');
      };

      // Validate partial updates if they include validated fields
      if (updates.title !== undefined || updates.start_date !== undefined || updates.end_date !== undefined) {
        // Build full validation object from updates with defaults for required fields
        // Skip file size validation for existing/unchanged URLs
        const validationData = {
          title: updates.title ?? 'placeholder',
          cash_allotment: updates.cash_allotment ?? 1,
          start_date: updates.start_date ?? new Date().toISOString().split('T')[0],
          end_date: updates.end_date ?? updates.start_date ?? new Date().toISOString().split('T')[0],
          description: updates.description,
          category: updates.category,
          ad_format: updates.ad_format,
          // Only include URLs for validation if they're new uploads (data URLs)
          image_url: isExistingUrl(updates.image_url) ? undefined : updates.image_url,
          video_url: isExistingUrl(updates.video_url) ? undefined : updates.video_url,
          code: updates.code,
          status: updates.status,
          destination_url: updates.destination_url ?? 'https://placeholder.com',
        };
        
        const validationResult = validateCampaignData(validationData);
        if (!validationResult.success) {
          const errors = formatValidationErrors(validationResult.error);
          throw new Error(errors.join(', '));
        }
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-campaigns', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-campaigns'] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-campaigns', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-campaigns'] });
    },
  });

  return {
    createCampaign: createCampaign.mutateAsync,
    updateCampaign: updateCampaign.mutateAsync,
    deleteCampaign: deleteCampaign.mutateAsync,
    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
    isDeleting: deleteCampaign.isPending,
  };
}
