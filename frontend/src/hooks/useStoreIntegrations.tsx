import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type IntegrationPlatform = 'shopify' | 'woocommerce' | 'custom_api';
export type IntegrationStatus = 'pending' | 'connected' | 'disconnected' | 'error';
export type OrderEventType = 'order_placed' | 'order_paid' | 'order_fulfilled' | 'order_shipped' | 'custom';

export interface StoreIntegration {
  id: string;
  company_id: string;
  platform: IntegrationPlatform;
  status: IntegrationStatus;
  store_url: string | null;
  store_name: string | null;
  store_id: string | null;
  api_endpoint: string | null;
  webhook_secret: string | null;
  auto_verify_conversions: boolean;
  tracked_events: OrderEventType[];
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationEvent {
  id: string;
  integration_id: string;
  event_type: OrderEventType;
  external_order_id: string;
  order_total: number | null;
  order_currency: string;
  customer_email: string | null;
  tracking_id: string | null;
  campaign_id: string | null;
  user_id: string | null;
  processed: boolean;
  conversion_created: boolean;
  error_message: string | null;
  created_at: string;
}

// Platform display info
export const PLATFORM_INFO: Record<IntegrationPlatform, { name: string; icon: string; description: string; requiresOAuth: boolean }> = {
  shopify: {
    name: 'Shopify',
    icon: '🛍️',
    description: 'Connect your Shopify store to automatically track orders and verify conversions.',
    requiresOAuth: true
  },
  woocommerce: {
    name: 'WooCommerce',
    icon: '🛒',
    description: 'Integrate with your WooCommerce store for seamless order tracking.',
    requiresOAuth: false // Uses API keys
  },
  custom_api: {
    name: 'Custom API',
    icon: '🔌',
    description: 'Connect any platform using our REST API webhooks.',
    requiresOAuth: false
  }
};

export const EVENT_TYPE_INFO: Record<OrderEventType, { name: string; description: string }> = {
  order_placed: { name: 'Order Placed', description: 'When a new order is created' },
  order_paid: { name: 'Order Paid', description: 'When payment is confirmed' },
  order_fulfilled: { name: 'Order Fulfilled', description: 'When order is marked as fulfilled' },
  order_shipped: { name: 'Order Shipped', description: 'When order is shipped' },
  custom: { name: 'Custom Event', description: 'Custom order status event' }
};

export function useStoreIntegrations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all integrations for the company
  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ['store-integrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('company_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StoreIntegration[];
    },
    enabled: !!user?.id,
  });

  // Create new integration
  const createIntegration = useMutation({
    mutationFn: async (params: {
      platform: IntegrationPlatform;
      store_url?: string;
      api_endpoint?: string;
      api_key?: string;
      tracked_events?: OrderEventType[];
      auto_verify_conversions?: boolean;
    }) => {
      const webhookSecret = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('store_integrations')
        .insert({
          company_id: user?.id,
          platform: params.platform,
          store_url: params.store_url,
          api_endpoint: params.api_endpoint,
          api_key: params.api_key,
          webhook_secret: webhookSecret,
          tracked_events: params.tracked_events || ['order_paid'],
          auto_verify_conversions: params.auto_verify_conversions ?? true,
          status: params.platform === 'custom_api' ? 'connected' : 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data as StoreIntegration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success('Integration created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    }
  });

  // Update integration settings
  const updateIntegration = useMutation({
    mutationFn: async (params: {
      id: string;
      tracked_events?: OrderEventType[];
      auto_verify_conversions?: boolean;
      status?: IntegrationStatus;
    }) => {
      const { data, error } = await supabase
        .from('store_integrations')
        .update({
          tracked_events: params.tracked_events,
          auto_verify_conversions: params.auto_verify_conversions,
          status: params.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('company_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as StoreIntegration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success('Integration updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    }
  });

  // Delete integration
  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('store_integrations')
        .delete()
        .eq('id', id)
        .eq('company_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success('Integration deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    }
  });

  // Regenerate webhook secret
  const regenerateWebhookSecret = useMutation({
    mutationFn: async (id: string) => {
      const newSecret = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('store_integrations')
        .update({
          webhook_secret: newSecret,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as StoreIntegration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success('Webhook secret regenerated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to regenerate secret: ${error.message}`);
    }
  });

  // Initiate Shopify OAuth
  const initiateShopifyOAuth = useMutation({
    mutationFn: async (shopUrl: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-oauth-start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ shop_url: shopUrl }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate OAuth');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Shopify OAuth page
      window.location.href = data.auth_url;
    },
    onError: (error: Error) => {
      toast.error(`Shopify connection failed: ${error.message}`);
    }
  });

  // Connect WooCommerce with API keys
  const connectWooCommerce = useMutation({
    mutationFn: async (params: { store_url: string; consumer_key: string; consumer_secret: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/woocommerce-connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect WooCommerce');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success('WooCommerce connected successfully!');
    },
    onError: (error: Error) => {
      toast.error(`WooCommerce connection failed: ${error.message}`);
    }
  });

  // Disconnect integration (revoke access)
  const disconnectIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('store_integrations')
        .update({
          status: 'disconnected',
          access_token: null,
          refresh_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast.success('Integration disconnected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  });

  return {
    integrations,
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    regenerateWebhookSecret,
    initiateShopifyOAuth,
    connectWooCommerce,
    disconnectIntegration
  };
}

// Hook for fetching integration events
export function useIntegrationEvents(integrationId: string | null) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['integration-events', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_events')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as IntegrationEvent[];
    },
    enabled: !!integrationId,
  });

  return { events, isLoading };
}

// Generate webhook URL for integration
export function getWebhookUrl(integrationId: string, platform: IntegrationPlatform): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/functions/v1/integration-webhook/${platform}/${integrationId}`;
}
