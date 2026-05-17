import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FraudRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  parameters: Record<string, unknown> | null;
  action: string;
  severity: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FraudFlag {
  id: string;
  transaction_id: string;
  rule_id: string | null;
  flag_type: string;
  severity: string;
  details: Record<string, unknown> | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  rule?: FraudRule;
}

export interface FraudSettings {
  id: string;
  company_id: string | null;
  default_hold_days: number;
  high_risk_hold_days: number;
  critical_risk_hold_days: number;
  max_conversions_per_user_per_day: number | null;
  max_conversions_per_user_per_campaign: number | null;
  auto_reject_risk_threshold: number | null;
  auto_verify_risk_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface FraudStats {
  totalFlagged: number;
  highRisk: number;
  criticalRisk: number;
  autoRejected: number;
  unresolvedFlags: number;
}

// Hook to fetch fraud rules
export function useFraudRules() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['fraud-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_rules')
        .select('*')
        .order('severity', { ascending: false });

      if (error) throw error;
      return data as FraudRule[];
    },
    enabled: isAdmin,
  });
}

// Hook to update fraud rule
export function useUpdateFraudRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ruleId, 
      updates 
    }: { 
      ruleId: string; 
      updates: Partial<Omit<FraudRule, 'parameters'> & { parameters?: Record<string, unknown> | null }>;
    }) => {
      const updatePayload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('fraud_rules')
        .update(updatePayload as any)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Fraud rule updated');
      queryClient.invalidateQueries({ queryKey: ['fraud-rules'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rule');
    },
  });
}

// Hook to fetch fraud settings
export function useFraudSettings() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['fraud-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_settings')
        .select('*')
        .is('company_id', null)
        .single();

      if (error) throw error;
      return data as FraudSettings;
    },
    enabled: isAdmin,
  });
}

// Hook to update fraud settings
export function useUpdateFraudSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<FraudSettings>) => {
      const { data, error } = await supabase
        .from('fraud_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .is('company_id', null)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Fraud settings updated');
      queryClient.invalidateQueries({ queryKey: ['fraud-settings'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
}

// Hook to fetch fraud flags for a transaction
export function useFraudFlags(transactionId?: string) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['fraud-flags', transactionId],
    queryFn: async () => {
      let query = supabase
        .from('fraud_flags')
        .select(`
          *,
          rule:fraud_rules(*)
        `)
        .order('created_at', { ascending: false });

      if (transactionId) {
        query = query.eq('transaction_id', transactionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FraudFlag[];
    },
    enabled: isAdmin && !!transactionId,
  });
}

// Hook to get all unresolved fraud flags
export function useUnresolvedFraudFlags() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['unresolved-fraud-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_flags')
        .select(`
          *,
          rule:fraud_rules(*)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FraudFlag[];
    },
    enabled: isAdmin,
  });
}

// Hook to resolve a fraud flag
export function useResolveFraudFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      flagId, 
      notes 
    }: { 
      flagId: string; 
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('fraud_flags')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: notes,
        })
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Fraud flag resolved');
      queryClient.invalidateQueries({ queryKey: ['fraud-flags'] });
      queryClient.invalidateQueries({ queryKey: ['unresolved-fraud-flags'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resolve flag');
    },
  });
}

// Hook to get fraud statistics
export function useFraudStats() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['fraud-stats'],
    queryFn: async () => {
      // Get transactions with risk scores
      const { data: transactions, error: txError } = await supabase
        .from('cashback_transactions')
        .select('risk_score, fraud_flags_count, verification_status');

      if (txError) throw txError;

      // Get unresolved flags count
      const { count: unresolvedFlags, error: flagError } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);

      if (flagError) throw flagError;

      const stats: FraudStats = {
        totalFlagged: transactions?.filter(t => (t.fraud_flags_count || 0) > 0).length || 0,
        highRisk: transactions?.filter(t => (t.risk_score || 0) >= 40 && (t.risk_score || 0) < 70).length || 0,
        criticalRisk: transactions?.filter(t => (t.risk_score || 0) >= 70).length || 0,
        autoRejected: transactions?.filter(t => 
          t.verification_status === 'rejected' && 
          (t.risk_score || 0) >= 90
        ).length || 0,
        unresolvedFlags: unresolvedFlags || 0,
      };

      return stats;
    },
    enabled: isAdmin,
  });
}

// Hook to get high-risk transactions for fraud queue
export function useFraudQueue() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['fraud-queue'],
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
        .or('fraud_flags_count.gt.0,risk_score.gte.40')
        .eq('verification_status', 'pending')
        .order('risk_score', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
}

// Notification settings interface
export interface NotificationSettings {
  id: string;
  user_id: string;
  notify_high_risk: boolean;
  notify_critical_risk: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Hook to fetch notification settings for current user
export function useNotificationSettings() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: isAdmin && !!user?.id,
  });
}

// Hook to update notification settings
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<NotificationSettings, 'notify_high_risk' | 'notify_critical_risk' | 'email_enabled'>>) => {
      // Upsert - insert if not exists, update if exists
      const { data, error } = await supabase
        .from('fraud_notification_settings')
        .upsert({
          user_id: user?.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Notification settings updated');
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notification settings');
    },
  });
}
