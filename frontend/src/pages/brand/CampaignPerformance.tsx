import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Heart,
  ShoppingBag,
  IndianRupee,
  Users,
  ThumbsUp,
  Meh,
  Frown,
  MapPin,
  Loader2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { PerformanceSkeleton } from "@/components/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useCampaignById } from "@/hooks/useCampaigns";
import {
  useCampaignPerformanceStats,
  useCampaignReactionBreakdown,
  useCampaignActivityLog,
  useCampaignDemographics,
} from "@/hooks/useCampaignPerformance";

const CampaignPerformance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userType, isLoading: authLoading } = useAuth();

  const { campaign, isLoading: campaignLoading } = useCampaignById(id || "");
  const { stats, isLoading: statsLoading } = useCampaignPerformanceStats(id || "");
  const { breakdown, isLoading: breakdownLoading } = useCampaignReactionBreakdown(id || "");
  const { activities, isLoading: activitiesLoading } = useCampaignActivityLog(id || "");
  const { demographics, isLoading: demographicsLoading } = useCampaignDemographics(id || "");

  // Redirect if not authenticated as company
  useEffect(() => {
    if (!authLoading && (!user || userType !== "company")) {
      navigate("/login");
    }
  }, [user, userType, authLoading, navigate]);

  if (authLoading || campaignLoading || statsLoading) {
    return <PerformanceSkeleton />;
  }

  if (!campaign) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
        <Link to="/brand/dashboard" className="text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isExpired = campaign.end_date < new Date().toISOString().split("T")[0];

  // Calculate conversion funnel
  const funnelData = {
    views: stats?.views || 0,
    reactions: stats?.reactions || 0,
    conversions: stats?.conversions || 0,
  };
  const viewToReactionRate = funnelData.views > 0 ? ((funnelData.reactions / funnelData.views) * 100).toFixed(1) : "0";
  const reactionToConversionRate = funnelData.reactions > 0 ? ((funnelData.conversions / funnelData.reactions) * 100).toFixed(1) : "0";

  // Reaction breakdown data
  const totalReactions = breakdown
    ? breakdown.impressed + breakdown.relatable + breakdown.decent + breakdown.boring
    : 0;
  const reactionPercentages = {
    impressed: totalReactions > 0 ? ((breakdown?.impressed || 0) / totalReactions) * 100 : 0,
    relatable: totalReactions > 0 ? ((breakdown?.relatable || 0) / totalReactions) * 100 : 0,
    decent: totalReactions > 0 ? ((breakdown?.decent || 0) / totalReactions) * 100 : 0,
    boring: totalReactions > 0 ? ((breakdown?.boring || 0) / totalReactions) * 100 : 0,
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case "view":
        return { label: "Viewed", color: "bg-blue-500" };
      case "conversion":
        return { label: "Grabbed Deal", color: "bg-green-500" };
      case "reaction_impressed":
        return { label: "Reacted: Impressed", color: "bg-red-500" };
      case "reaction_relatable":
        return { label: "Reacted: Relatable", color: "bg-emerald-500" };
      case "reaction_decent":
        return { label: "Reacted: Decent", color: "bg-yellow-500" };
      case "reaction_boring":
        return { label: "Reacted: Boring", color: "bg-gray-500" };
      default:
        return { label: eventType, color: "bg-muted" };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <Link
            to="/brand/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container py-8">
        {/* Campaign Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-6">
            {campaign.image_url && (
              <img
                src={campaign.image_url}
                alt={campaign.title}
                className="h-24 w-24 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{campaign.title}</h1>
                <Badge variant={isExpired ? "secondary" : "success"}>
                  {isExpired ? "Expired" : "Active"}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">{campaign.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(campaign.start_date).toLocaleDateString()} -{" "}
                  {new Date(campaign.end_date).toLocaleDateString()}
                </span>
                <Badge variant="cashback">₹{campaign.cash_allotment} Cash Allotment</Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.views || 0}</p>
                  <p className="text-sm text-muted-foreground">Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-pink-500/10 p-3">
                  <Heart className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.reactions || 0}</p>
                  <p className="text-sm text-muted-foreground">Reactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-3">
                  <ShoppingBag className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.conversions || 0}</p>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/10 p-3">
                  <IndianRupee className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{stats?.cashbackDistributed || 0}</p>
                  <p className="text-sm text-muted-foreground">Cashback</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.uniqueUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Unique Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Conversion Funnel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Conversion Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Views</span>
                      <span className="text-muted-foreground">{funnelData.views}</span>
                    </div>
                    <Progress value={100} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Reactions</span>
                      <span className="text-muted-foreground">
                        {funnelData.reactions} ({viewToReactionRate}%)
                      </span>
                    </div>
                    <Progress
                      value={funnelData.views > 0 ? (funnelData.reactions / funnelData.views) * 100 : 0}
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Conversions</span>
                      <span className="text-muted-foreground">
                        {funnelData.conversions} ({reactionToConversionRate}% of reactions)
                      </span>
                    </div>
                    <Progress
                      value={funnelData.views > 0 ? (funnelData.conversions / funnelData.views) * 100 : 0}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reaction Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Reaction Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {breakdownLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : totalReactions === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No reactions yet</p>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            Impressed
                          </span>
                          <span className="text-muted-foreground">
                            {breakdown?.impressed || 0} ({reactionPercentages.impressed.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={reactionPercentages.impressed} className="h-2 bg-red-100" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                            Relatable
                          </span>
                          <span className="text-muted-foreground">
                            {breakdown?.relatable || 0} ({reactionPercentages.relatable.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={reactionPercentages.relatable} className="h-2 bg-green-100" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2">
                            <Meh className="h-4 w-4 text-yellow-500" />
                            Decent
                          </span>
                          <span className="text-muted-foreground">
                            {breakdown?.decent || 0} ({reactionPercentages.decent.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={reactionPercentages.decent} className="h-2 bg-yellow-100" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2">
                            <Frown className="h-4 w-4 text-gray-500" />
                            Boring
                          </span>
                          <span className="text-muted-foreground">
                            {breakdown?.boring || 0} ({reactionPercentages.boring.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={reactionPercentages.boring} className="h-2 bg-gray-100" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Demographics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demographicsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !demographics?.age_groups.length && !demographics?.gender_distribution.length ? (
                    <p className="text-center text-muted-foreground py-4">No demographic data yet</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Age Groups */}
                      {demographics?.age_groups.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Age Groups</h4>
                          <div className="flex flex-wrap gap-2">
                            {demographics.age_groups.map((ag) => (
                              <Badge key={ag.label} variant="secondary">
                                {ag.label}: {ag.count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gender */}
                      {demographics?.gender_distribution.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Gender</h4>
                          <div className="flex flex-wrap gap-2">
                            {demographics.gender_distribution.map((g) => (
                              <Badge key={g.label} variant="secondary">
                                {g.label}: {g.count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top Locations */}
                      {demographics?.top_locations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Top Locations</h4>
                          <div className="space-y-2">
                            {demographics.top_locations.map((loc, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {loc.city}, {loc.state}
                                </span>
                                <Badge variant="outline" className="ml-auto">
                                  {loc.count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Activity Log */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity yet</p>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        const eventInfo = getEventLabel(activity.event_type || "");
                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 pb-4 border-b last:border-0"
                          >
                            <div className={`w-2 h-2 rounded-full mt-2 ${eventInfo.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium truncate">
                                  {activity.user_name || "Guest"}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {eventInfo.label}
                                </Badge>
                              </div>
                              {activity.location_city && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {activity.location_city}
                                  {activity.location_state && `, ${activity.location_state}`}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CampaignPerformance;
