import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PendingConversion {
  id: string;
  user_id: string;
  company_id: string;
  campaign_id: string;
  amount: number;
  status: string;
  tracking_click_id: string | null;
  verification_status: string;
  verified_at: string | null;
  verified_by: string | null;
  hold_until: string | null;
  rejection_reason: string | null;
  created_at: string;
  risk_score: number | null;
  fraud_flags_count: number | null;
  extended_hold_until: string | null;
  auto_verified: boolean | null;
  campaign?: {
    id: string;
    title: string;
    company?: {
      id: string;
      name: string;
      logo_url: string | null;
    };
  };
  tracking_click?: {
    id: string;
    tracking_id: string;
    conversion_type: string | null;
    conversion_data: Record<string, unknown> | null;
    converted_at: string | null;
  };
}

export interface WebhookLog {
  id: string;
  source: string;
  endpoint: string;
  payload: Record<string, unknown> | null;
  headers: Record<string, unknown> | null;
  signature_valid: boolean;
  processed: boolean;
  tracking_id: string | null;
  error_message: string | null;
  created_at: string;
}

// Hook to get pending conversions for admin
export function usePendingConversions() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['pending-conversions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashback_transactions')
        .select(`
          *,
          campaign:campaigns(
            id,
            title,
            company:companies(id, name, logo_url)
          )
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PendingConversion[];
    },
    enabled: isAdmin,
  });
}

// Hook to get all conversions with verification details for admin
export function useAllConversions(verificationStatus?: string) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['all-conversions', verificationStatus],
    queryFn: async () => {
      let query = supabase
        .from('cashback_transactions')
        .select(`
          *,
          campaign:campaigns(
            id,
            title,
            company:companies(id, name, logo_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (verificationStatus) {
        query = query.eq('verification_status', verificationStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PendingConversion[];
    },
    enabled: isAdmin,
  });
}

// Hook to verify or reject a conversion
export function useVerifyConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      action, 
      reason 
    }: { 
      transactionId: string; 
      action: 'verify' | 'reject';
      reason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('verify-conversion', {
        body: { 
          transaction_id: transactionId,
          action,
          reason,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === 'verify' 
          ? 'Conversion verified and cashback credited' 
          : 'Conversion rejected'
      );
      queryClient.invalidateQueries({ queryKey: ['pending-conversions'] });
      queryClient.invalidateQueries({ queryKey: ['all-conversions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tracking-clicks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process conversion');
    },
  });
}

// Hook to get webhook logs for admin
export function useWebhookLogs(limit = 50) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['webhook-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: isAdmin,
  });
}

// Hook to get company's pending conversions
export function useCompanyPendingConversions() {
  const { company } = useAuth();

  return useQuery({
    queryKey: ['company-pending-conversions', company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashback_transactions')
        .select(`
          *,
          campaign:campaigns(id, title)
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PendingConversion[];
    },
    enabled: !!company?.id,
  });
}

// Hook to get user's transactions with verification status
export function useUserConversions() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['user-conversions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashback_transactions')
        .select(`
          *,
          campaign:campaigns(
            id,
            title,
            company:companies(id, name, logo_url)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PendingConversion[];
    },
    enabled: !!user?.id && !!profile,
  });
}
