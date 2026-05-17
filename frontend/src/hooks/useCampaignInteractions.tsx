import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type ReactionType = 'impressed' | 'relatable' | 'decent' | 'boring';

// Track campaign view
export const useTrackView = (campaignId: string) => {
  const { user } = useAuth();
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    if (!campaignId || hasTracked) return;

    const trackView = async () => {
      try {
        await supabase.from('campaign_analytics').insert({
          campaign_id: campaignId,
          user_id: user?.id || null,
          event_type: 'view',
        });
        setHasTracked(true);
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, [campaignId, user?.id, hasTracked]);
};

// Get and set user reaction
export const useReaction = (campaignId: string) => {
  const { user } = useAuth();
  const [reaction, setReaction] = useState<ReactionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing reaction
  useEffect(() => {
    if (!campaignId || !user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchReaction = async () => {
      try {
        const { data, error } = await supabase
          .from('campaign_reactions')
          .select('reaction')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setReaction(data?.reaction as ReactionType || null);
      } catch (error) {
        console.error('Error fetching reaction:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReaction();
  }, [campaignId, user?.id]);

  const saveReaction = async (newReaction: ReactionType | null) => {
    if (!user?.id) {
      toast.error('Please login to react to this campaign');
      return;
    }

    setIsSaving(true);
    const previousReaction = reaction;
    setReaction(newReaction);

    try {
      if (newReaction === null) {
        // Delete reaction
        await supabase
          .from('campaign_reactions')
          .delete()
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id);
      } else {
        // Upsert reaction
        const { error } = await supabase
          .from('campaign_reactions')
          .upsert({
            campaign_id: campaignId,
            user_id: user.id,
            reaction: newReaction,
          }, {
            onConflict: 'campaign_id,user_id',
          });

        if (error) throw error;

        // Track analytics event
        await supabase.from('campaign_analytics').insert({
          campaign_id: campaignId,
          user_id: user.id,
          event_type: `reaction_${newReaction}`,
        });
      }
    } catch (error) {
      console.error('Error saving reaction:', error);
      setReaction(previousReaction);
      toast.error('Failed to save reaction');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleReaction = (newReaction: ReactionType) => {
    saveReaction(reaction === newReaction ? null : newReaction);
  };

  return { reaction, toggleReaction, isLoading, isSaving };
};

// Check if user has an active tracking click for the campaign
export const useHasGrabbedDeal = (campaignId: string) => {
  const { user } = useAuth();
  const [hasGrabbed, setHasGrabbed] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<'none' | 'clicked' | 'converted' | 'verified'>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when dependencies change
    setHasGrabbed(false);
    setTrackingId(null);
    setTrackingStatus('none');
    
    if (!campaignId || !user?.id) {
      setIsLoading(false);
      return;
    }

    // CRITICAL FIX: Set loading to true BEFORE starting async check
    setIsLoading(true);

    const checkGrabbed = async () => {
      try {
        // Check tracking_clicks for active clicks
        const { data: trackingData, error: trackingError } = await supabase
          .from('tracking_clicks')
          .select('id, status, tracking_id')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (trackingError) throw trackingError;

        if (trackingData) {
          setHasGrabbed(true);
          setTrackingId(trackingData.tracking_id);
          setTrackingStatus(trackingData.status as typeof trackingStatus);
        } else {
          // Fallback: Check old cashback_transactions without tracking
          const { data: txData, error: txError } = await supabase
            .from('cashback_transactions')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (txError) throw txError;
          setHasGrabbed(!!txData);
          setTrackingStatus(txData ? 'converted' : 'none');
        }
      } catch (error) {
        console.error('Error checking deal status:', error);
        // Ensure hasGrabbed is false on error to allow retries
        setHasGrabbed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkGrabbed();
  }, [campaignId, user?.id]);

  return { hasGrabbed, trackingId, trackingStatus, isLoading, setHasGrabbed, setTrackingId, setTrackingStatus };
};

// Generate tracking link and activate deal
export const useGrabDeal = (campaignId: string) => {
  const { user } = useAuth();
  const [isGrabbing, setIsGrabbing] = useState(false);

  const grabDeal = async (): Promise<{ 
    success: boolean; 
    trackingId?: string; 
    trackingUrl?: string;
    destinationUrl?: string | null;
    couponCode?: string;
  }> => {
    if (!user?.id) {
      toast.error('Please login to grab this deal');
      return { success: false };
    }

    setIsGrabbing(true);

    try {
      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Session expired. Please login again.');
        return { success: false };
      }

      // Call generate-tracking-link edge function
      const { data, error } = await supabase.functions.invoke('generate-tracking-link', {
        body: { campaign_id: campaignId },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate tracking link');
      }

      if (!data?.tracking_id) {
        throw new Error(data?.error || 'Failed to generate tracking link');
      }

      // Track conversion event
      await supabase.from('campaign_analytics').insert({
        campaign_id: campaignId,
        user_id: user.id,
        event_type: 'click',
      });

      return {
        success: true, 
        trackingId: data.tracking_id,
        trackingUrl: data.tracking_url,
        destinationUrl: data.destination_url,
        couponCode: data.coupon_code,
      };
    } catch (error: unknown) {
      console.error('Error grabbing deal:', error);
      const message = error instanceof Error ? error.message : 'Failed to grab deal. Please try again.';
      toast.error(message);
      return { success: false };
    } finally {
      setIsGrabbing(false);
    }
  };

  return { grabDeal, isGrabbing };
};

// Hook to get user's pending verifications
export const usePendingVerifications = () => {
  const { user } = useAuth();
  const [pendingDeals, setPendingDeals] = useState<Array<{
    id: string;
    trackingId: string;
    campaignTitle: string;
    companyName: string;
    amount: number;
    status: string;
    verificationStatus: string;
    holdUntil: string | null;
    createdAt: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPendingDeals = async () => {
      try {
        // Get tracking clicks
        const { data: clicks, error: clicksError } = await supabase
          .from('tracking_clicks')
          .select('id, tracking_id, status, created_at, campaign_id')
          .eq('user_id', user.id)
          .in('status', ['clicked', 'converted'])
          .order('created_at', { ascending: false });

        if (clicksError) throw clicksError;

        if (!clicks || clicks.length === 0) {
          setPendingDeals([]);
          setIsLoading(false);
          return;
        }

        // Get campaign details separately
        const campaignIds = [...new Set(clicks.map(c => c.campaign_id))];
        const { data: campaigns, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, title, cash_allotment, company_id')
          .in('id', campaignIds);

        if (campaignError) throw campaignError;

        // Get company details
        const companyIds = [...new Set((campaigns || []).map(c => c.company_id))];
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);

        if (companyError) throw companyError;

        // Get associated cashback transactions
        const clickIds = clicks.map(c => c.id);
        
        const { data: transactions, error: txError } = await supabase
          .from('cashback_transactions')
          .select('tracking_click_id, verification_status, hold_until, amount')
          .in('tracking_click_id', clickIds);

        if (txError) throw txError;

        // Build lookup maps
        const campaignMap = new Map((campaigns || []).map(c => [c.id, c]));
        const companyMap = new Map((companies || []).map(c => [c.id, c]));
        const txMap = new Map((transactions || []).map(tx => [tx.tracking_click_id, tx]));

        const formattedDeals = clicks.map(click => {
          const tx = txMap.get(click.id);
          const campaign = campaignMap.get(click.campaign_id);
          const company = campaign ? companyMap.get(campaign.company_id) : null;
          
          return {
            id: click.id,
            trackingId: click.tracking_id,
            campaignTitle: campaign?.title || 'Unknown Campaign',
            companyName: company?.name || 'Unknown Company',
            amount: tx?.amount || campaign?.cash_allotment || 0,
            status: click.status,
            verificationStatus: tx?.verification_status || 'awaiting_conversion',
            holdUntil: tx?.hold_until || null,
            createdAt: click.created_at,
          };
        });

        setPendingDeals(formattedDeals);
      } catch (error) {
        console.error('Error fetching pending deals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingDeals();
  }, [user?.id]);

  return { pendingDeals, isLoading };
};
