import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CompanyWallet {
  id: string;
  company_id: string;
  balance: number;
  total_deposited: number;
  total_spent: number;
  updated_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  pending: number;
  total_withdrawn: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  company_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'cashback_paid';
  description: string | null;
  created_at: string;
}

export interface CashbackTransaction {
  id: string;
  user_id: string;
  campaign_id: string | null;
  company_id: string | null;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  created_at: string;
  campaign?: {
    title: string;
    company?: {
      name: string;
      logo_url: string;
    };
  };
}

export function useCompanyWallet() {
  const { user, company } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading, error } = useQuery({
    queryKey: ['company-wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('company_wallets')
        .select('*')
        .eq('company_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no wallet exists, create one
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from('company_wallets')
          .insert({ company_id: user.id })
          .select()
          .single();
        
        if (createError) throw createError;
        return newWallet as CompanyWallet;
      }
      
      return data as CompanyWallet;
    },
    enabled: !!user?.id && !!company,
  });

  const addFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('add_funds_to_wallet', {
        p_company_id: user.id,
        p_amount: amount,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-wallet', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', user?.id] });
    },
  });

  return {
    wallet,
    isLoading,
    error,
    addFunds: addFundsMutation.mutateAsync,
    isAddingFunds: addFundsMutation.isPending,
  };
}

export function useUserWallet() {
  const { user, profile } = useAuth();

  const { data: wallet, isLoading, error, refetch } = useQuery({
    queryKey: ['user-wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserWallet | null;
    },
    enabled: !!user?.id && !!profile,
  });

  return { wallet, isLoading, error, refetch };
}

export function useWalletTransactions() {
  const { user, company } = useAuth();

  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user?.id && !!company,
  });

  return { transactions: transactions ?? [], isLoading, error, refetch };
}

export function useCashbackTransactions() {
  const { user, profile } = useAuth();

  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['cashback-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('cashback_transactions')
        .select(`
          *,
          campaign:campaigns(
            title,
            company:companies(name, logo_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CashbackTransaction[];
    },
    enabled: !!user?.id && !!profile,
  });

  return { transactions: transactions ?? [], isLoading, error, refetch };
}
