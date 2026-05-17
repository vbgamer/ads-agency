import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TrackingClick {
  id: string;
  tracking_id: string;
  user_id: string;
  campaign_id: string;
  company_id: string;
  click_url: string | null;
  status: 'clicked' | 'converted' | 'expired' | 'cancelled';
  conversion_type: string | null;
  conversion_data: Record<string, unknown> | null;
  converted_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface TrackingClickWithDetails extends TrackingClick {
  campaign?: {
    id: string;
    title: string;
    cash_allotment: number;
    company?: {
      id: string;
      name: string;
      logo_url: string | null;
    };
  };
  user?: {
    id: string;
    name: string;
    email: string | null;
  };
}

// Hook to generate a tracking link when user clicks "Grab Deal"
export function useGenerateTrackingLink() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTrackingLink = async (campaignId: string): Promise<{ 
    tracking_id: string; 
    coupon_code?: string;
    webhook_callback_url?: string;
  } | null> => {
    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please login to grab this deal');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('generate-tracking-link', {
        body: { campaign_id: campaignId },
      });

      if (error) {
        console.error('Error generating tracking link:', error);
        toast.error(error.message || 'Failed to generate tracking link');
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      return {
        tracking_id: data.tracking_id,
        coupon_code: data.coupon_code,
        webhook_callback_url: data.webhook_callback_url,
      };
    } catch (error: unknown) {
      console.error('Error:', error);
      toast.error('Failed to grab deal');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateTrackingLink, isGenerating };
}

// Hook to get user's tracking clicks
export function useUserTrackingClicks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-tracking-clicks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_clicks')
        .select(`
          *,
          campaign:campaigns(
            id,
            title,
            cash_allotment,
            company:companies(id, name, logo_url)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TrackingClickWithDetails[];
    },
    enabled: !!user?.id,
  });
}

// Hook for admin to view all pending tracking clicks
export function useAdminTrackingClicks(status?: string) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-tracking-clicks', status],
    queryFn: async () => {
      let query = supabase
        .from('tracking_clicks')
        .select(`
          *,
          campaign:campaigns(
            id,
            title,
            cash_allotment,
            company:companies(id, name, logo_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as TrackingClickWithDetails[];
    },
    enabled: isAdmin,
  });
}

// Hook for companies to view clicks on their campaigns
export function useCompanyTrackingClicks() {
  const { company } = useAuth();

  return useQuery({
    queryKey: ['company-tracking-clicks', company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_clicks')
        .select(`
          *,
          campaign:campaigns(
            id,
            title,
            cash_allotment
          )
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TrackingClickWithDetails[];
    },
    enabled: !!company?.id,
  });
}

// Hook for admin to simulate a conversion
export function useSimulateConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trackingId, 
      conversionType = 'app_install',
      eventValue,
    }: { 
      trackingId: string; 
      conversionType?: 'app_install' | 'purchase' | 'signup';
      eventValue?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('simulate-conversion', {
        body: { 
          tracking_id: trackingId,
          conversion_type: conversionType,
          event_value: eventValue,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Conversion simulated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-tracking-clicks'] });
      queryClient.invalidateQueries({ queryKey: ['pending-conversions'] });
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to simulate conversion');
    },
  });
}
