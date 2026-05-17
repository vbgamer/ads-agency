import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  LayoutDashboard,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  TrendingUp,
  Users,
  MousePointer,
  DollarSign,
  ChevronDown,
  Edit,
  Trash2,
  User,
  PlusCircle,
  IndianRupee,
  CheckCircle,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Edit2,
  Video,
  Film,
  Image,
  Sun,
  Moon,
  Mail,
  Clock,
  XCircle,
  CreditCard,
  Upload,
  X,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Wallet,
  Loader2,
  Download,
  FileText,
  History,
  Menu,
  Copy,
  Check,
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";
import { getWebhookCallbackUrl } from "@/lib/campaignValidation";
import { useNavigate, Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { CampaignCreationForm } from "@/components/brand/CampaignCreationForm";
import { BrandOnboarding } from "@/components/brand/BrandOnboarding";
import { GettingStartedChecklist } from "@/components/brand/GettingStartedChecklist";
import { BrandPaymentMethodsSection } from "@/components/brand/BrandPaymentMethodsSection";
import { ImageCropper } from "@/components/ui/image-cropper";
import { MockPaymentModal } from "@/components/payment/MockPaymentModal";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyCampaigns, useCampaignMutations, Campaign } from "@/hooks/useCampaigns";
import { BrandDashboardSkeleton } from "@/components/skeletons";
import { useCompanyWallet, useWalletTransactions } from "@/hooks/useWallet";
import { useCampaignStats, useConsumerDemographics, useTopLocations } from "@/hooks/useAnalytics";
import { useProcessWalletTopup, useWalletTopupTransactions } from "@/hooks/usePayment";
import { generatePaymentReceipt, generateWalletTopupSummary } from "@/lib/generatePaymentReceipt";
import { ReceiptDownloadButton } from "@/components/payment/ReceiptDownloadButton";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { categories } from "@/data/mockData";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { WebhookIntegrationGuide } from "@/components/brand/WebhookIntegrationGuide";

export default function BrandDashboard() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user, company, isLoading: authLoading, signOut, userType } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);

  // Supabase hooks
  const { campaigns, activeCampaigns, expiredCampaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = useCompanyCampaigns();
  const { updateCampaign, deleteCampaign, isDeleting } = useCampaignMutations();
  const { wallet, isAddingFunds } = useCompanyWallet();
  const { transactions } = useWalletTransactions();
  const { stats: campaignAnalytics } = useCampaignStats();
  const { demographics } = useConsumerDemographics();
  const { locations } = useTopLocations();
  const processWalletTopup = useProcessWalletTopup();
  const { data: walletTopupPayments, isLoading: walletTopupPaymentsLoading } = useWalletTopupTransactions();

  // Profile editing state
  const [profileForm, setProfileForm] = useState({
    name: "",
    category: "",
    bio: "",
    logoUrl: "",
    coverUrl: "",
    website: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    facebook: "",
  });

  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState("");
  const [cropperType, setCropperType] = useState<"logo" | "cover">("logo");

  // Wallet state
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Redirect if not authenticated as company
  useEffect(() => {
    if (!authLoading && (!user || userType !== 'company')) {
      navigate("/login", { replace: true });
    }
  }, [user, userType, authLoading, navigate]);

  // Update profile form when company data loads
  useEffect(() => {
    if (company) {
      setProfileForm({
        name: company.name || "",
        category: company.category || "",
        bio: company.bio || "",
        logoUrl: company.logo_url || "",
        coverUrl: company.cover_url || "",
        website: company.website || "",
        instagram: company.instagram || "",
        twitter: company.twitter || "",
        linkedin: company.linkedin || "",
        facebook: company.facebook || "",
      });
    }
  }, [company]);

  const handleAddFunds = () => {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsAddFundsOpen(false);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (
    success: boolean,
    cardLastFour: string,
    errorMessage?: string
  ) => {
    const amount = parseFloat(addFundsAmount);
    await processWalletTopup.mutateAsync({
      amount,
      cardLastFour,
      success,
      errorMessage,
    });
    
    if (success) {
      setShowPaymentModal(false);
      setAddFundsAmount("");
    }
  };

  const handleOpenEditProfile = () => {
    if (company) {
      setProfileForm({
        name: company.name || "",
        category: company.category || "",
        bio: company.bio || "",
        logoUrl: company.logo_url || "",
        coverUrl: company.cover_url || "",
        website: company.website || "",
        instagram: company.instagram || "",
        twitter: company.twitter || "",
        linkedin: company.linkedin || "",
        facebook: company.facebook || "",
      });
    }
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    
    try {
      const { error } = await supabase.from('companies').update({
        name: profileForm.name.trim(),
        category: profileForm.category,
        bio: profileForm.bio.trim(),
        logo_url: profileForm.logoUrl.trim(),
        cover_url: profileForm.coverUrl.trim(),
        website: profileForm.website.trim(),
        instagram: profileForm.instagram.trim(),
        twitter: profileForm.twitter.trim(),
        linkedin: profileForm.linkedin.trim(),
        facebook: profileForm.facebook.trim(),
      }).eq('id', user?.id);

      if (error) throw error;
      
      setIsEditProfileOpen(false);
      toast.success("Profile updated successfully");
      // Refresh page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result as string);
        setCropperType("cover");
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result as string);
        setCropperType("logo");
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    if (cropperType === "logo") {
      setProfileForm(prev => ({ ...prev, logoUrl: croppedImage }));
    } else {
      setProfileForm(prev => ({ ...prev, coverUrl: croppedImage }));
    }
    setCropperOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete company data (campaigns will be cascade deleted if FK is set up)
      const { error } = await supabase.from('companies').delete().eq('id', user?.id);
      if (error) throw error;
      
      await signOut();
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId);
      toast.success("Campaign deleted successfully");
    } catch (error) {
      toast.error("Failed to delete campaign");
    }
  };

  const handlePauseCampaign = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
    try {
      await updateCampaign({ id: campaignId, updates: { status: newStatus } });
      toast.success(`Campaign ${newStatus === 'paused' ? 'paused' : 'resumed'} successfully`);
    } catch (error) {
      toast.error("Failed to update campaign");
    }
  };

  // Category options for SearchableSelect - memoized for performance
  // IMPORTANT: All hooks must be called before any conditional returns
  const categorySelectOptions = useMemo(() => 
    categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon
    })), 
  []);

  // Loading state
  if (authLoading) {
    return <BrandDashboardSkeleton />;
  }

  if (!user || !company) {
    return null;
  }

  const companyName = company.name || "Company";
  const walletBalance = wallet?.balance ?? 0;
  const totalSpent = wallet?.total_spent ?? 0;

  // Check if onboarding should be shown
  const shouldShowOnboarding = 
    company.onboarding_completed === false && 
    walletBalance === 0 && 
    campaigns.length === 0 &&
    !campaignsLoading;

  // Show onboarding wizard for new brands
  if (shouldShowOnboarding || showOnboarding) {
    return (
      <BrandOnboarding
        companyName={companyName}
        walletBalance={walletBalance}
        campaignCount={campaigns.length}
        onComplete={() => {
          setShowOnboarding(false);
          window.location.reload();
        }}
      />
    );
  }

  const stats = [
    {
      title: "Total Clicks",
      value: campaignAnalytics?.total_clicks?.toString() || "0",
      change: "--",
      icon: MousePointer,
      color: "text-primary",
    },
    {
      title: "Conversions",
      value: campaignAnalytics?.total_conversions?.toString() || "0",
      change: "--",
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Active Users",
      value: campaignAnalytics?.unique_users?.toString() || "0",
      change: "--",
      icon: Users,
      color: "text-pending",
    },
    {
      title: "Commission Due",
      value: `₹${totalSpent.toLocaleString()}`,
      change: "--",
      icon: DollarSign,
      color: "text-accent",
    },
  ];

  const campaignStats = [
    {
      title: "Cashback Pool",
      value: `₹${walletBalance.toLocaleString()}`,
      subtitle: walletBalance === 0 
        ? "Add funds to start offering cashbacks" 
        : `₹${totalSpent.toLocaleString()} distributed`,
      icon: Wallet,
      isWallet: true,
    },
    {
      title: "Total Campaigns",
      value: campaigns.length.toString(),
      subtitle: campaigns.length === 0 ? "No campaigns created yet." : `${activeCampaigns.length} active, ${expiredCampaigns.length} expired`,
      icon: Tag,
    },
    {
      title: "Active Campaigns",
      value: activeCampaigns.length.toString(),
      subtitle: activeCampaigns.length === 0 ? "No active campaigns." : "Currently running",
      icon: CheckCircle,
    },
  ];

  const CampaignCard = ({ campaign, showActions = true }: { campaign: Campaign; showActions?: boolean }) => {
    const isExpired = campaign.status === 'expired' || new Date(campaign.end_date) < new Date();
    const isPaused = campaign.status === 'paused';
    const [copied, setCopied] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    
    const webhookUrl = getWebhookCallbackUrl(campaign.id);
    
    const handleCopyWebhookUrl = () => {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("Webhook URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    };
    
    return (
      <Card variant="default" className={`overflow-hidden ${isExpired ? 'opacity-70' : ''}`}>
        {/* Campaign Image */}
        <div className="relative h-40 bg-muted flex items-center justify-center">
          {campaign.image_url ? (
            <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-4xl font-bold text-muted-foreground/30">
              ₹{campaign.cash_allotment}
            </div>
          )}
          <Badge 
            variant={isExpired ? "secondary" : isPaused ? "outline" : "success"} 
            className="absolute left-2 top-2"
          >
            {isExpired ? (
              <><XCircle className="mr-1 h-3 w-3" /> Expired</>
            ) : isPaused ? (
              <><Clock className="mr-1 h-3 w-3" /> Paused</>
            ) : (
              'Active'
            )}
          </Badge>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2 h-8 w-8 bg-background/80 hover:bg-background"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/brand/campaign/${campaign.id}/performance`)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Performance
                </DropdownMenuItem>
                {!isExpired && (
                  <DropdownMenuItem onClick={() => handlePauseCampaign(campaign.id, campaign.status || 'active')}>
                    {isPaused ? (
                      <><CheckCircle className="mr-2 h-4 w-4" /> Resume</>
                    ) : (
                      <><Clock className="mr-2 h-4 w-4" /> Pause</>
                    )}
                  </DropdownMenuItem>
                )}
                {!isExpired && (
                  <DropdownMenuItem onClick={() => {
                    setEditingCampaign(campaign);
                    setActiveTab('edit-campaign');
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{campaign.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
          <div className="flex items-center justify-between mt-3">
            <Badge variant="cashback">₹{campaign.cash_allotment} Cash</Badge>
            <span className="text-xs text-muted-foreground">
              Ends: {new Date(campaign.end_date).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
        
        {/* Webhook URL Banner */}
        <div className="border-t bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <LinkIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {webhookUrl}
              </span>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setShowGuide(true)}
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleCopyWebhookUrl}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <WebhookIntegrationGuide
          webhookUrl={webhookUrl}
          open={showGuide}
          onOpenChange={setShowGuide}
        />
      </Card>
    );
  };

  const renderProfileSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Profile Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Your Company Profile</h1>
          <p className="text-muted-foreground">This is how your profile appears to others.</p>
        </div>
        <Button variant="outline" onClick={handleOpenEditProfile}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Card */}
      <Card variant="default" className="mb-8 overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5">
          {company?.cover_url && (
            <img 
              src={company.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover" 
            />
          )}
        </div>
        
        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12 left-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-card text-3xl font-bold text-muted-foreground shadow-lg overflow-hidden">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={companyName} className="w-full h-full object-cover" />
              ) : (
                companyName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          
          {/* Company Details */}
          <div className="pt-16">
            <h2 className="font-display text-2xl font-bold">{companyName}</h2>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Megaphone className="h-4 w-4" />
              <span className="text-sm">{company?.category || "Business"}</span>
            </div>
            <p className="mt-3 text-muted-foreground">{company?.bio || "No biography provided."}</p>
            
            {/* Social Links */}
            {(company?.website || company?.instagram || company?.twitter || company?.linkedin || company?.facebook) && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {company?.website && (
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {company?.instagram && (
                  <a 
                    href={`https://instagram.com/${company.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    @{company.instagram.replace('@', '')}
                  </a>
                )}
                {company?.twitter && (
                  <a 
                    href={`https://twitter.com/${company.twitter.replace('@', '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    @{company.twitter.replace('@', '')}
                  </a>
                )}
                {company?.linkedin && (
                  <a 
                    href={company.linkedin.startsWith('http') ? company.linkedin : `https://linkedin.com/company/${company.linkedin}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {company?.facebook && (
                  <a 
                    href={company.facebook.startsWith('http') ? company.facebook : `https://facebook.com/${company.facebook}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Active Campaigns Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Your Active Campaigns</h2>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setActiveTab('create-campaign')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        </div>

        {campaignsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeCampaigns.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <Card variant="default" className="py-12">
            <CardContent className="text-center">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No active campaigns yet.</p>
              <Button onClick={() => setActiveTab('create-campaign')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expired Campaigns Section */}
      {expiredCampaigns.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Past Campaigns</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expiredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderDashboardSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Welcome, {companyName}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your campaigns and performance.
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setActiveTab('create-campaign')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Campaign
        </Button>
      </div>

      {/* Getting Started Checklist */}
      {showChecklist && (
        <GettingStartedChecklist
          company={company}
          totalDeposited={wallet?.total_deposited ?? 0}
          campaignCount={campaigns.length}
          totalConversions={campaignAnalytics?.total_conversions ?? 0}
          onEditProfile={() => setIsEditProfileOpen(true)}
          onAddFunds={() => setIsAddFundsOpen(true)}
          onCreateCampaign={() => setActiveTab('create-campaign')}
          onViewCampaigns={() => setActiveTab('profile')}
          onDismiss={() => setShowChecklist(false)}
        />
      )}

      {/* Campaign Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {campaignStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              variant={stat.isWallet ? "accent" : "default"}
              className={stat.isWallet && walletBalance < 1000 ? "border-pending" : ""}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.isWallet ? "text-primary" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <p className={`font-display text-3xl font-bold ${stat.isWallet ? "text-primary" : ""}`}>
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.subtitle}</p>
                {stat.isWallet && (
                  <Button 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={() => setIsAddFundsOpen(true)}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Funds
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Original Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <Card variant="default">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-success">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Consumer Statistics Section */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-bold mb-2">Consumer Statistics</h2>
        <p className="text-muted-foreground mb-4">Insights into the users who have purchased your deals.</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Age Distribution */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Age Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Number of customers in different age groups.</p>
            </CardHeader>
            <CardContent>
              {demographics && demographics.ageDistribution && Object.keys(demographics.ageDistribution).length > 0 ? (
                <div className="space-y-2">
                {Object.entries(demographics.ageDistribution).map(([age, count]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm">{age}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-center font-medium text-muted-foreground">Age Distribution</p>
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    No data available yet. Customer data will appear here after they purchase a deal.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Gender Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Breakdown of customers by gender.</p>
            </CardHeader>
            <CardContent>
              {demographics && demographics.genderDistribution && Object.keys(demographics.genderDistribution).length > 0 ? (
                <div className="space-y-2">
                {Object.entries(demographics.genderDistribution).map(([gender, count]) => (
                    <div key={gender} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{gender}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-center font-medium text-muted-foreground">Gender Distribution</p>
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    No data available yet. Customer data will appear here after they purchase a deal.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Locations Section */}
      <div className="mb-8">
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Locations</CardTitle>
            <p className="text-sm text-muted-foreground">Where most of your customers are located.</p>
          </CardHeader>
          <CardContent>
            {locations && locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((loc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{loc.location}</span>
                    <span className="font-medium">{loc.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-center text-sm text-muted-foreground">
                  No location data available yet. Customer data will appear here after they purchase a deal.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns Table */}
      {campaigns.length > 0 && (
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Campaigns</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('profile')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Campaign
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Cashback
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Clicks
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Conversions
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Valid Until
                    </th>
                    <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 5).map((campaign) => {
                    const isExpired = campaign.status === 'expired' || new Date(campaign.end_date) < new Date();
                    return (
                      <tr
                        key={campaign.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-4">
                          <p className="font-medium">{campaign.title}</p>
                        </td>
                        <td className="py-4">
                          <Badge variant="cashback">
                            ₹{campaign.cash_allotment}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <Badge
                            variant={
                              isExpired ? "secondary" : 
                              campaign.status === "active" ? "success" : 
                              "outline"
                            }
                          >
                            {isExpired ? 'expired' : campaign.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-muted-foreground">
                          {(campaign.clicks ?? 0).toLocaleString()}
                        </td>
                        <td className="py-4 text-muted-foreground">
                          {(campaign.conversions ?? 0).toLocaleString()}
                        </td>
                        <td className="py-4 text-muted-foreground">
                          {new Date(campaign.end_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                                <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {campaign.status !== 'expired' && new Date(campaign.end_date) >= new Date() && (
                                <DropdownMenuItem onClick={() => {
                                  setEditingCampaign(campaign);
                                  setActiveTab('edit-campaign');
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteCampaign(campaign.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );


  const sidebarItems = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "wallet", icon: Wallet, label: "Wallet" },
    { id: "payment-methods", icon: CreditCard, label: "Payment Methods" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  // Sidebar Content Component
  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* App Logo & Name */}
      <Link to="/" className="flex h-16 items-center gap-2 border-b border-border px-6 hover:bg-secondary/50 transition-colors">
        <img 
          src="/icon-192.png" 
          alt="ADSSIMSIM Logo" 
          className="h-9 w-9 rounded-lg shadow-sm object-contain"
        />
        <span className="font-display text-lg font-bold">ADSSIMSIM</span>
      </Link>

      <div className="px-4 py-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
          Company Hub
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
              activeTab === item.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive min-h-[44px]"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b bg-background/95 backdrop-blur-lg flex items-center justify-between px-4">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <span className="font-semibold">
          {sidebarItems.find(item => item.id === activeTab)?.label || "Dashboard"}
        </span>
        
        <Button variant="ghost" size="icon" onClick={handleLogout} className="min-w-[44px] min-h-[44px]">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Horizontal Tabs */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-30 border-b bg-background/95 backdrop-blur-lg overflow-x-auto">
        <div className="flex px-2 py-2 gap-1 min-w-max">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-h-[40px]",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-4 lg:p-8",
        "lg:ml-64",
        "pt-[120px] lg:pt-0"
      )}>

        {activeTab === "profile" && renderProfileSection()}
        {activeTab === "dashboard" && renderDashboardSection()}

        {activeTab === "wallet" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">Company Wallet</h1>
                <p className="text-muted-foreground">Manage your cashback pool funds.</p>
              </div>
              <Button onClick={() => setIsAddFundsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Funds
              </Button>
            </div>

            {/* Wallet Overview */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              {/* Current Balance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl font-bold text-primary">
                    ₹{walletBalance.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Available for cashbacks</p>
                </CardContent>
              </Card>

              {/* Total Spent */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl font-bold text-accent">
                    ₹{totalSpent.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Given to customers</p>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Payment Summary for top-ups */}
                {walletTopupPayments && walletTopupPayments.length > 0 && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Added to Wallet</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        ₹{walletTopupPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {walletTopupPayments.length} top-up{walletTopupPayments.length > 1 ? 's' : ''} made
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => generateWalletTopupSummary({
                          companyName: company?.name || "Company",
                          companyEmail: company?.email || "",
                          transactions: walletTopupPayments,
                          currency: "₹"
                        })}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Download Summary
                      </Button>
                    </div>
                  </div>
                )}

                {transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((tx) => {
                      // Find matching payment transaction for receipt
                      const matchingPayment = walletTopupPayments?.find(p => 
                        p.amount === tx.amount && 
                        tx.type === 'deposit'
                      );
                      
                      return (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{tx.description || tx.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.created_at || '').toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={tx.amount >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                              {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                            </span>
                            {tx.type === 'deposit' && matchingPayment && (
                              <ReceiptDownloadButton
                                receiptData={{
                                  type: "wallet_topup",
                                  transactionId: matchingPayment.id,
                                  amount: matchingPayment.amount,
                                  currency: "₹",
                                  date: matchingPayment.created_at,
                                  cardLastFour: matchingPayment.card_last_four || undefined,
                                  companyName: company?.name || "Company",
                                  companyEmail: company?.email || "",
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No transactions yet. Add funds to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
        {activeTab === "payment-methods" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <BrandPaymentMethodsSection />
          </motion.div>
        )}
        {activeTab === "create-campaign" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CampaignCreationForm 
              onComplete={() => {
                refetchCampaigns();
                setActiveTab('profile');
              }}
              onCancel={() => setActiveTab('dashboard')}
            />
          </motion.div>
        )}
        {activeTab === "edit-campaign" && editingCampaign && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CampaignCreationForm 
              campaign={editingCampaign}
              onComplete={() => {
                refetchCampaigns();
                setEditingCampaign(null);
                setActiveTab('profile');
              }}
              onCancel={() => {
                setEditingCampaign(null);
                setActiveTab('dashboard');
              }}
            />
          </motion.div>
        )}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl font-bold mb-8">Company Settings</h1>
            
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Company Profile</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your company's public information.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <input
                    type="text"
                    defaultValue={companyName}
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Email</label>
                  <input
                    type="email"
                    defaultValue={company?.email}
                    disabled
                    className="w-full rounded-md border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed.</p>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <SearchableSelect
                    value={company?.category || ""}
                    onValueChange={() => {}}
                    options={categorySelectOptions}
                    placeholder="Select a category"
                    searchPlaceholder="Search categories..."
                    emptyMessage="No category found."
                  />
                </div>

                {/* Save Button */}
                <Button className="bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card variant="default" className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <p className="text-sm text-muted-foreground">Customize how the app looks.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="text-sm font-medium">Theme</label>
                  <div className="flex gap-3">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex-1 gap-2"
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex-1 gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="flex-1"
                    >
                      System
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings Section */}
            <Card variant="default" className="mt-6 border-destructive/30">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Privacy settings</CardTitle>
                <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your company account and remove all your data including campaigns, offers, and analytics.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>

    {/* Edit Profile Dialog */}
    <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your company profile information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                {profileForm.logoUrl ? (
                  <>
                    <img src={profileForm.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setProfileForm(prev => ({ ...prev, logoUrl: "" }))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">
                    {profileForm.name.charAt(0).toUpperCase() || "C"}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Upload Logo</span>
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="relative h-24 w-full rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
              {profileForm.coverUrl ? (
                <>
                  <img src={profileForm.coverUrl} alt="Cover" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setProfileForm(prev => ({ ...prev, coverUrl: "" }))}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <Label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center justify-center h-full">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Click to upload cover image</span>
                </Label>
              )}
            </div>
            <Input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter company name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <SearchableSelect
              value={profileForm.category}
              onValueChange={(value) => setProfileForm(prev => ({ ...prev, category: value }))}
              options={categorySelectOptions}
              placeholder="Select a category"
              searchPlaceholder="Search categories..."
              emptyMessage="No category found."
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell users about your company..."
              rows={3}
            />
          </div>

          {/* Social Media Links */}
          <div className="space-y-3">
            <Label>Social Media Links</Label>
            
            {/* Website */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={profileForm.website}
                onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            {/* Instagram */}
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={profileForm.instagram}
                onChange={(e) => setProfileForm(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="instagram_handle"
              />
            </div>
            
            {/* Twitter/X */}
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={profileForm.twitter}
                onChange={(e) => setProfileForm(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="twitter_handle"
              />
            </div>
            
            {/* LinkedIn */}
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={profileForm.linkedin}
                onChange={(e) => setProfileForm(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="linkedin_handle"
              />
            </div>
            
            {/* Facebook */}
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={profileForm.facebook}
                onChange={(e) => setProfileForm(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="facebook_handle"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Image Cropper Dialog */}
    <ImageCropper
      open={cropperOpen}
      onClose={() => setCropperOpen(false)}
      imageSrc={cropperImage}
      onCropComplete={handleCropComplete}
      aspectRatio={cropperType === "logo" ? 1 : 16 / 9}
    />

    {/* Add Funds Dialog */}
    <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to Cashback Pool</DialogTitle>
          <DialogDescription>
            Add funds to your cashback pool to offer cashbacks to customers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={addFundsAmount}
              onChange={(e) => setAddFundsAmount(e.target.value)}
              min="1"
            />
          </div>
          <div className="flex gap-2">
            {[1000, 5000, 10000, 25000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setAddFundsAmount(amount.toString())}
              >
                ₹{amount.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddFundsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddFunds} disabled={!addFundsAmount || parseFloat(addFundsAmount) <= 0}>
            Proceed to Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Payment Modal */}
    <MockPaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      amount={parseFloat(addFundsAmount) || 0}
      title="Add Funds to Wallet"
      description="Top up your cashback pool to start offering rewards to customers."
      onPaymentComplete={handlePaymentComplete}
    />
    </>
  );
}
