import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, ArrowRight, Lock, Loader2 } from "lucide-react";
import { CompanyHubSkeleton } from "@/components/skeletons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ui/share-buttons";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CampaignWithCompany {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  cash_allotment: number;
  category: string | null;
  ad_format: string | null;
  image_url: string | null;
  video_url: string | null;
  start_date: string;
  end_date: string;
  code: string | null;
  status: string | null;
  clicks: number | null;
  conversions: number | null;
  created_at: string | null;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    cover_url: string | null;
    category: string | null;
    bio: string | null;
  } | null;
}

export default function CompanyHub() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isUserLoggedIn = !!user;

  // Fetch company info from Supabase
  const { data: companyInfo, isLoading: companyLoading } = useQuery({
    queryKey: ['company-hub', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch campaigns for this company
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['company-campaigns-public', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          company:companies(id, name, logo_url, cover_url, category, bio)
        `)
        .eq('company_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CampaignWithCompany[];
    },
    enabled: !!id,
  });

  const today = new Date().toISOString().split('T')[0];
  
  const activeCampaigns = campaigns?.filter(c => 
    c.status === 'active' && c.start_date <= today && c.end_date >= today
  ) ?? [];
  

  if (companyLoading || campaignsLoading) {
    return <CompanyHubSkeleton />;
  }

  if (!companyInfo) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
          <p className="text-muted-foreground mb-6">The company you're looking for doesn't exist.</p>
          <Link to="/offers">
            <Button>Browse All Offers</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const CampaignCard = ({ campaign, isExpired = false }: { campaign: CampaignWithCompany; isExpired?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="deal" className={`group overflow-hidden ${isExpired ? 'opacity-70' : ''}`}>
        <CardContent className="p-0">
          <div className="relative p-6">
            {isExpired ? (
              <Badge variant="secondary" className="absolute right-4 top-4">
                Expired
              </Badge>
            ) : (
              <Badge variant="success" className="absolute right-4 top-4">
                Active
              </Badge>
            )}

            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                <img
                  src={campaign.company?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.company?.name || 'Company')}&background=10b981&color=fff`}
                  alt={campaign.company?.name || 'Company'}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.company?.name || 'Company')}&background=10b981&color=fff`;
                  }}
                />
              </div>
              <div>
                <h3 className="font-display font-bold">{campaign.company?.name || 'Company'}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {isExpired ? 'Ended' : 'Valid until'}: {new Date(campaign.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <h4 className="mb-2 font-semibold leading-tight">{campaign.title}</h4>
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
              {campaign.description}
            </p>

            <div className="flex items-center justify-between">
              <Badge variant="cashback" className="text-base">
                ₹{campaign.cash_allotment} Cash
              </Badge>
              <div className="flex items-center gap-1">
                {!isExpired && (
                  <ShareButtons
                    url={`${window.location.origin}/campaign/${campaign.id}`}
                    title={`${campaign.title} by ${campaign.company?.name}`}
                    description={campaign.description || undefined}
                    size="icon"
                  />
                )}
                {!isExpired && (
                  isUserLoggedIn ? (
                    <Button size="sm" onClick={() => navigate(`/campaign/${campaign.id}`)}>
                      Get Deal
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="opacity-60">
                      <Lock className="mr-1 h-3 w-3" />
                      Login to Get Deal
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Back Button */}
        <Link
          to="/offers"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Offers
        </Link>

        {/* Company Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="default" className="overflow-hidden">
            {/* Cover Banner */}
            {companyInfo.cover_url ? (
              <img 
                src={companyInfo.cover_url} 
                alt={`${companyInfo.name} banner`}
                className="h-32 md:h-48 w-full object-cover"
              />
            ) : (
              <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/5" />
            )}
            
            {/* Company Info */}
            <div className="relative px-6 pb-6">
              {/* Logo */}
              <div className="absolute -top-12 left-6">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-card shadow-lg">
                  <img
                    src={companyInfo.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyInfo.name)}&background=10b981&color=fff&size=96`}
                    alt={companyInfo.name}
                    className="h-full w-full object-contain p-2"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyInfo.name)}&background=10b981&color=fff&size=96`;
                    }}
                  />
                </div>
              </div>
              
              <div className="pt-16">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl font-bold">{companyInfo.name}</h1>
                    <div className="mt-2 flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {companyInfo.category || 'Business'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-sm">
                      {activeCampaigns.length} Active Offers
                    </Badge>
                    <ShareButtons
                      url={`${window.location.origin}/company/${id}`}
                      title={`Check out ${companyInfo.name}! 🎉`}
                      description={companyInfo.bio || `Discover great deals from ${companyInfo.name}`}
                    />
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">{companyInfo.bio || 'No description available.'}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Active Campaigns Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="font-display text-2xl font-bold mb-6">Active Campaigns</h2>
          
          {activeCampaigns.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card variant="default" className="py-12">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No active campaigns at the moment.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

      </div>
    </MainLayout>
  );
}
