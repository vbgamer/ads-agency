import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  User, 
  Crown, 
  Heart, 
  LogOut,
  TrendingUp,
  Gift,
  Clock,
  ArrowRight,
  CheckCircle2,
  Bell,
  Target,
  Users,
  Loader2,
  CalendarDays,
  Sun,
  Moon,
  Check,
  Sparkles,
  Zap,
  Shield,
  Star,
  History,
  Download,
  FileText,
  CreditCard,
  Menu,
  HelpCircle
} from "lucide-react";
import { triggerDonationConfetti } from "@/lib/confetti";
import { generateDonationReceipt, generateDonationSummary } from "@/lib/generateDonationReceipt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useAuth } from "@/hooks/useAuth";
import { DashboardSkeleton } from "@/components/skeletons";
import { useUserWallet, useCashbackTransactions } from "@/hooks/useWallet";
import { useSubscription, useProcessSubscriptionPayment, useProcessDonation, useDonationTransactions, useSubscriptionTransactions } from "@/hooks/usePayment";
import { generatePaymentReceipt, generateSubscriptionSummary } from "@/lib/generatePaymentReceipt";
import { ReceiptDownloadButton } from "@/components/payment/ReceiptDownloadButton";
import { PendingVerificationsSection } from "@/components/user/PendingVerificationsSection";
import { MockPaymentModal } from "@/components/payment/MockPaymentModal";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PaymentMethodsSection } from "@/components/user/PaymentMethodsSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserSupportSection } from "@/components/support/UserSupportSection";
import { NotificationSettings } from "@/components/pwa/NotificationSettings";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ReferralSection } from "@/components/user/ReferralSection";
import { PremiumGlitter } from "@/components/premium/PremiumGlitter";

type ActiveSection = "dashboard" | "wallet" | "payment-methods" | "profile" | "subscription" | "referrals" | "tips" | "support";

interface ProfileForm {
  name: string;
  phone: string;
  gender: string;
  age: string;
  city: string;
  state: string;
  country: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Dialog states
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    gender: "",
    age: "",
    city: "",
    state: "",
    country: ""
  });

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Subscription plan selection
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [showSubscriptionPaymentModal, setShowSubscriptionPaymentModal] = useState(false);
  
  // Donation states
  const [selectedDonation, setSelectedDonation] = useState<number | null>(null);
  const [customDonation, setCustomDonation] = useState("");
  const [showDonationModal, setShowDonationModal] = useState(false);
  
  // Supabase hooks
  const { user, profile, isLoading: authLoading, signOut, userType } = useAuth();
  const { wallet, isLoading: walletLoading, refetch: refetchWallet } = useUserWallet();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useCashbackTransactions();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const processSubscriptionPayment = useProcessSubscriptionPayment();
  const processDonation = useProcessDonation();
  const { data: donationHistory, isLoading: donationsLoading } = useDonationTransactions();
  const { data: subscriptionPayments, isLoading: subscriptionPaymentsLoading } = useSubscriptionTransactions();
  
  // Push notifications hook
  const { isSubscribed: isPushSubscribed, subscribe: subscribePush, isLoading: pushLoading } = usePushNotifications();

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchWallet(),
      refetchTransactions(),
    ]);
  }, [refetchWallet, refetchTransactions]);

  // Subscription plans data
  const subscriptionPlans = [
    { id: "monthly", name: "Monthly", price: 199, period: "month", savings: null, popular: false },
    { id: "quarterly", name: "Quarterly", price: 499, period: "3 months", savings: "Save ₹98", popular: false },
    { id: "yearly", name: "Yearly", price: 1499, period: "year", savings: "Save ₹889", popular: true },
  ];

  const selectedPlanData = subscriptionPlans.find(p => p.id === selectedPlan);

  const handleSubscriptionPayment = async (success: boolean, cardLastFour: string, errorMessage?: string) => {
    await processSubscriptionPayment.mutateAsync({
      planId: selectedPlan,
      amount: selectedPlanData?.price || 0,
      cardLastFour,
      success,
      errorMessage,
    });
    if (success) {
      setShowSubscriptionPaymentModal(false);
    }
  };

  // Redirect if not authenticated as user
  useEffect(() => {
    // Wait until auth is fully loaded AND userType is determined
    if (authLoading || (user && userType === null)) return;
    if (!user || userType !== 'user') {
      navigate("/login", { replace: true });
    }
  }, [user, userType, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out successfully" });
    navigate("/");
  };

  // Withdraw handler
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 100) {
      toast({ 
        title: "Invalid amount", 
        description: "Minimum withdrawal amount is ₹100",
        variant: "destructive" 
      });
      return;
    }

    if (amount > walletBalance) {
      toast({ 
        title: "Insufficient balance", 
        description: "You don't have enough balance to withdraw this amount",
        variant: "destructive" 
      });
      return;
    }

    setIsProcessingWithdraw(true);
    
    // Simulate withdrawal request (in real app, this would create a withdrawal request)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ 
      title: "Withdrawal requested", 
      description: `₹${amount} withdrawal request submitted. It will be processed within 3-5 business days.` 
    });
    
    setIsProcessingWithdraw(false);
    setWithdrawAmount("");
    setIsWithdrawDialogOpen(false);
  };

  // Edit profile handlers
  const handleOpenEditProfile = () => {
    setProfileForm({
      name: profile?.name || "",
      phone: profile?.phone || "",
      gender: profile?.gender || "",
      age: profile?.age || "",
      city: profile?.city || "",
      state: profile?.state || "",
      country: profile?.country || ""
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!profileForm.name.trim()) {
      toast({ 
        title: "Name required", 
        description: "Please enter your name",
        variant: "destructive" 
      });
      return;
    }

    setIsSavingProfile(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || null,
        gender: profileForm.gender || null,
        age: profileForm.age || null,
        city: profileForm.city.trim() || null,
        state: profileForm.state.trim() || null,
        country: profileForm.country.trim() || null
      })
      .eq('id', user.id);
    
    setIsSavingProfile(false);

    if (error) {
      toast({ 
        title: "Error saving profile", 
        description: error.message,
        variant: "destructive" 
      });
    } else {
      toast({ title: "Profile updated successfully" });
      setIsEditProfileOpen(false);
      // Reload the page to refresh profile data
      window.location.reload();
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeletingAccount(true);
    
    // Delete user profile (this will cascade to related data)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);
    
    if (error) {
      setIsDeletingAccount(false);
      toast({ 
        title: "Error deleting account", 
        description: error.message,
        variant: "destructive" 
      });
      return;
    }
    
    // Sign out the user
    await signOut();
    
    toast({ 
      title: "Account deleted", 
      description: "Your account has been permanently deleted" 
    });
    
    navigate("/");
  };

  // Tips card click handlers
  const handleTipClick = async (tipTitle: string) => {
    switch (tipTitle) {
      case "Complete Your Profile":
        handleOpenEditProfile();
        break;
      case "Enable Notifications":
        if (isPushSubscribed) {
          toast({ 
            title: "Already enabled", 
            description: "Push notifications are already active!" 
          });
        } else {
          await subscribePush();
        }
        break;
      case "Check Daily Deals":
        navigate("/offers");
        break;
      case "Refer Friends":
        setActiveSection("referrals");
        break;
    }
  };

  const sidebarItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "wallet" as const, label: "Wallet", icon: Wallet },
    { id: "payment-methods" as const, label: "Payment Methods", icon: CreditCard },
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "subscription" as const, label: "Subscription", icon: Crown },
    { id: "referrals" as const, label: "Referrals", icon: Users },
    { id: "support" as const, label: "Support", icon: HelpCircle },
    { id: "tips" as const, label: "Support Us", icon: Heart },
  ];

  // Loading state
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || !profile) {
    return null;
  }

  const walletBalance = wallet?.balance ?? 0;
  const pendingBalance = wallet?.pending ?? 0;
  const totalWithdrawn = wallet?.total_withdrawn ?? 0;
  
  // Premium status derived from subscription
  const isPremium = subscription?.status === 'active' && profile?.is_premium;

  const stats = [
    { label: "Total Earnings", value: `₹${walletBalance.toLocaleString()}`, icon: TrendingUp, color: "text-green-500" },
    { label: "Active Deals", value: "0", icon: Gift, color: "text-blue-500" },
    { label: "Pending Cashback", value: `₹${pendingBalance.toLocaleString()}`, icon: Clock, color: "text-amber-500" },
  ];

  const recentActivity = transactions?.slice(0, 5).map((tx) => ({
    action: `${tx.status === 'approved' ? 'Cashback received' : 'Pending cashback'}`,
    amount: tx.status === 'approved' ? `+₹${tx.amount}` : '',
    time: tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : '',
  })) || [];

  const tips = [
    { title: "Complete Your Profile", description: "Get ₹50 bonus by completing your profile details", icon: User, completed: false },
    { 
      title: "Enable Notifications", 
      description: isPushSubscribed ? "Notifications are enabled!" : "Never miss a deal with push notifications", 
      icon: isPushSubscribed ? CheckCircle2 : Bell,
      completed: isPushSubscribed
    },
    { title: "Check Daily Deals", description: "New exclusive deals are added every day", icon: Target, completed: false },
    { title: "Refer Friends", description: "Get ₹50 off Premium for each friend who subscribes", icon: Users, completed: false },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Premium Welcome Banner */}
            {isPremium && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-premium rounded-2xl p-6 text-white relative overflow-hidden shadow-premium"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-4 right-4 flex gap-1">
                  <Star className="h-4 w-4 text-yellow-300/80 animate-pulse" fill="currentColor" />
                  <Star className="h-3 w-3 text-yellow-300/60 animate-pulse" fill="currentColor" style={{ animationDelay: '0.5s' }} />
                  <Star className="h-2 w-2 text-yellow-300/40 animate-pulse" fill="currentColor" style={{ animationDelay: '1s' }} />
                </div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Crown className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Premium Member</h2>
                    <p className="text-white/80">Enjoy exclusive benefits and 40% extra cashback!</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className={cn(
                  "text-2xl font-bold",
                  isPremium && "text-gradient-gold"
                )}>
                  Welcome back, {profile?.name || "User"}!
                </h1>
                {isPremium && (
                  <Badge variant="premium" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Premium
                  </Badge>
                )}
                {profile?.is_supporter && (
                  <Badge className="gap-1 bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 hover:from-pink-600 hover:to-red-600">
                    <Heart className="h-3 w-3" />
                    Supporter
                  </Badge>
                )}
              </div>
              <p className={cn(
                "text-muted-foreground",
                isPremium && "text-amber-600/70 dark:text-amber-400/70"
              )}>
                Here's your cashback summary
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <Card key={stat.label} className={cn(isPremium && "premium-card border-premium-gold")}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn(
                          "text-sm",
                          isPremium ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                        )}>
                          {stat.label}
                        </p>
                        <p className={cn(
                          "text-2xl font-bold",
                          isPremium && "text-gradient-gold"
                        )}>
                          {stat.value}
                        </p>
                      </div>
                      <stat.icon className={cn(
                        "h-8 w-8",
                        isPremium ? "text-emerald-500" : stat.color
                      )} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pending Verifications Section */}
            <PendingVerificationsSection isPremium={isPremium} />

            <Card className={cn(isPremium && "premium-card border-premium-gold")}>
              <CardHeader>
                <CardTitle className={cn(isPremium && "text-gradient-gold")}>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className={cn(
                      "h-6 w-6 animate-spin",
                      isPremium ? "text-amber-500" : "text-primary"
                    )} />
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className={cn(
                        "flex items-center justify-between py-2 border-b last:border-0",
                        isPremium && "border-amber-200/30 dark:border-amber-800/30"
                      )}>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                        {activity.amount && (
                          <span className={cn(
                            "font-medium",
                            activity.amount.startsWith("+") 
                              ? isPremium ? "text-emerald-500" : "text-green-500"
                              : "text-muted-foreground"
                          )}>
                            {activity.amount}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity. Start exploring deals to earn cashback!
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/offers")}
                className={cn(
                  "gap-2",
                  isPremium ? "btn-premium-gold" : ""
                )}
              >
                Browse Deals <ArrowRight className="h-4 w-4" />
              </Button>
              {!isPremium && (
                <Button variant="outline" onClick={() => setActiveSection("subscription")}>
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        );

      case "payment-methods":
        return <PaymentMethodsSection isPremium={isPremium} />;

      case "wallet":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">My Wallet</h1>
              <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
            </div>

            {walletLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <p className="text-3xl font-bold text-green-500">₹{walletBalance.toLocaleString()}</p>
                      <Button
                        className={cn("mt-4 w-full", isPremium && "btn-premium-gold")}
                        onClick={() => setIsWithdrawDialogOpen(true)}
                        disabled={walletBalance < 100}
                      >
                        Withdraw
                      </Button>
                      {walletBalance < 100 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Min. ₹100 required
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">Pending Cashback</p>
                      <p className="text-3xl font-bold text-amber-500">₹{pendingBalance.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-4">Usually credited within 7 days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                      <p className="text-3xl font-bold text-blue-500">₹{totalWithdrawn.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-4">All time withdrawals</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : transactions && transactions.length > 0 ? (
                      <div className="space-y-4">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium">
                                {tx.status === 'approved' ? 'Cashback received' : 
                                 tx.status === 'pending' ? 'Pending cashback' : 'Cashback'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : ''}
                              </p>
                            </div>
                            <span className={tx.status === 'approved' ? "text-green-500 font-medium" : "text-amber-500 font-medium"}>
                              {tx.status === 'approved' ? '+' : ''}₹{tx.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No transactions yet. Start exploring deals to earn cashback!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">Manage your account details</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <Avatar className={cn(
                      "h-16 w-16",
                      isPremium && "premium-avatar-ring",
                      !isPremium && profile?.is_supporter && "supporter-avatar-ring"
                    )}>
                      <AvatarFallback className="text-xl">
                        {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {isPremium && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-1">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {!isPremium && profile?.is_supporter && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 rounded-full p-1">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold">{profile?.name}</h2>
                      {isPremium && (
                        <Badge variant="premium" className="gap-1 text-xs">
                          <Crown className="h-3 w-3" />
                          Premium Member
                        </Badge>
                      )}
                      {profile?.is_supporter && (
                        <Badge className="gap-1 text-xs bg-gradient-to-r from-pink-500 to-red-500 text-white border-0">
                          <Heart className="h-3 w-3" />
                          Supporter
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{profile?.gender || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{profile?.age || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {[profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleOpenEditProfile}
                    className={cn(isPremium && "btn-premium-gold")}
                  >
                    Edit Profile
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data including wallet balance, transaction history,
                          and subscription details.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete Account"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Separator className="my-6" />

                {/* Appearance Settings */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Sun className="h-5 w-5" />
                    Appearance
                  </h3>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "subscription": {
        const isActivePremium = subscription?.status === 'active' && profile?.is_premium;
        const subscriptionEndDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
        const daysRemaining = subscriptionEndDate ? differenceInDays(subscriptionEndDate, new Date()) : 0;
        
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Subscription</h1>
              <p className="text-muted-foreground">
                {isActivePremium ? 'Manage your premium subscription' : 'Upgrade to unlock premium benefits'}
              </p>
            </div>

            {/* Active Subscription Status */}
            {isActivePremium && subscriptionEndDate && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Premium Active</h3>
                      <p className="text-sm text-muted-foreground">
                        Your subscription is active until {subscriptionEndDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-primary">
                        <CalendarDays className="h-4 w-4" />
                        <span className="font-semibold">{daysRemaining} days left</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Free Plan */}
            <Card className={`border-2 ${!isActivePremium ? 'border-primary' : 'border-muted-foreground/30'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Free Plan
                  {!isActivePremium && <Badge variant="secondary">Current</Badge>}
                </CardTitle>
                <CardDescription>Basic cashback benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">₹0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Access to all public deals</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Standard cashback rates</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Basic email support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium Plans Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Premium Plans</h2>
                {isActivePremium && <Badge variant="secondary">Current</Badge>}
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                {subscriptionPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? "border-2 border-primary shadow-lg"
                        : "border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <Badge
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                      >
                        Most Popular
                      </Badge>
                    )}
                    <CardContent className="p-6 text-center">
                      <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                      <div className="mb-3">
                        <span className="text-4xl font-bold">₹{plan.price}</span>
                        <span className="text-muted-foreground text-sm">/{plan.period}</span>
                      </div>
                      {plan.savings && (
                        <Badge variant="outline" className="mb-4 text-green-600 border-green-600">
                          {plan.savings}
                        </Badge>
                      )}
                      <div
                        className={`mx-auto h-6 w-6 rounded-full border-2 ${
                          selectedPlan === plan.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/50"
                        } flex items-center justify-center mt-4`}
                      >
                        {selectedPlan === plan.id && (
                          <Check className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Premium Benefits */}
              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-center">Premium Benefits</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Early Access to Deals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">40% More Cashback</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Exclusive Deals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Premium Support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscribe Button */}
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto px-12"
                  onClick={() => setShowSubscriptionPaymentModal(true)}
                  disabled={processSubscriptionPayment.isPending}
                >
                  {processSubscriptionPayment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isActivePremium ? 'Extend Subscription' : 'Get Premium Now'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Cancel anytime. 7-day money-back guarantee.
                </p>
              </div>
            </div>

            {/* Subscription Payment History */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  Your subscription payment records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionPaymentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : subscriptionPayments && subscriptionPayments.length > 0 ? (
                  <div className="space-y-3">
                    {/* Total Paid Summary */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Paid</span>
                        <span className="text-xl font-bold text-primary">
                          ₹{subscriptionPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {subscriptionPayments.length} payment{subscriptionPayments.length > 1 ? 's' : ''} made
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => generateSubscriptionSummary({
                            recipientName: profile?.name || "User",
                            recipientEmail: profile?.email || "",
                            transactions: subscriptionPayments,
                            currency: "₹"
                          })}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Download Summary
                        </Button>
                      </div>
                    </div>
                    
                    {/* Individual Payments List */}
                    <div className="divide-y">
                      {subscriptionPayments.map((payment) => {
                        const planName = subscriptionPlans.find(p => 
                          p.price === payment.amount
                        )?.name || "Premium";
                        
                        return (
                          <div key={payment.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Crown className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{planName} Plan - ₹{payment.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                                  {payment.card_last_four && ` • Card ****${payment.card_last_four}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                              <ReceiptDownloadButton
                                receiptData={{
                                  type: "subscription",
                                  transactionId: payment.id,
                                  amount: payment.amount,
                                  currency: "₹",
                                  date: payment.created_at,
                                  cardLastFour: payment.card_last_four || undefined,
                                  recipientName: profile?.name || "User",
                                  recipientEmail: profile?.email || "",
                                  planName: `${planName} Premium`,
                                  periodStart: subscription?.current_period_start,
                                  periodEnd: subscription?.current_period_end,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No payment history yet</p>
                    <p className="text-sm">Your subscription payments will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      case "support":
        return <UserSupportSection />;

      case "referrals":
        return <ReferralSection isPremium={isPremium} />;

      case "tips": {
        const donationAmounts = [
          { value: 50, label: "₹50", description: "Buy me a coffee" },
          { value: 100, label: "₹100", description: "A small thank you" },
          { value: 250, label: "₹250", description: "Support development" },
          { value: 500, label: "₹500", description: "Generous supporter" },
        ];
        
        const finalDonation = selectedDonation || (customDonation ? parseInt(customDonation) : 0);
        
        return (
          <div className="space-y-6 relative">
            {/* Floating Hearts Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <Heart className="absolute top-10 left-10 h-6 w-6 text-pink-300/40 animate-float-slow" />
              <Heart className="absolute top-20 right-16 h-4 w-4 text-red-300/50 animate-float-medium" style={{ animationDelay: '0.5s' }} />
              <Heart className="absolute bottom-20 left-20 h-5 w-5 text-pink-400/30 animate-float-fast" style={{ animationDelay: '1s' }} />
              <Heart className="absolute top-32 left-1/4 h-3 w-3 text-red-400/40 animate-float-medium" style={{ animationDelay: '1.5s' }} />
              <Heart className="absolute bottom-32 right-1/4 h-4 w-4 text-pink-300/50 animate-float-slow" style={{ animationDelay: '2s' }} />
              <Heart className="absolute top-16 right-1/3 h-5 w-5 text-red-300/30 animate-float-fast" style={{ animationDelay: '0.8s' }} />
            </div>

            <div className="text-center max-w-2xl mx-auto relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-heartbeat shadow-lg shadow-pink-500/30">
                <Heart className="h-8 w-8 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold">Support the Developer</h1>
              <p className="text-muted-foreground mt-2">
                If you enjoy using this app, consider supporting its development with a small donation. 
                Every contribution helps keep this project alive and growing!
              </p>
            </div>

            {/* Donation Amount Options */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-3xl mx-auto relative z-10">
              {donationAmounts.map((amount, index) => (
                <Card 
                  key={amount.value}
                  className={`cursor-pointer transition-all duration-300 hover:border-primary/50 hover:scale-105 hover:-translate-y-1 animate-fade-in-up ${
                    selectedDonation === amount.value ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => { setSelectedDonation(amount.value); setCustomDonation(""); }}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{amount.label}</p>
                    <p className="text-sm text-muted-foreground">{amount.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="max-w-md mx-auto relative z-10">
              <Label htmlFor="customDonation">Or enter a custom amount</Label>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="customDonation"
                    type="number"
                    min="10"
                    placeholder="Enter amount"
                    className="pl-8"
                    value={customDonation}
                    onChange={(e) => { setCustomDonation(e.target.value); setSelectedDonation(null); }}
                  />
                </div>
              </div>
            </div>

            {/* Donate Button */}
            <div className="text-center relative z-10">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25"
                disabled={finalDonation < 10}
                onClick={() => setShowDonationModal(true)}
              >
                <Heart className="mr-2 h-4 w-4" />
                Donate {finalDonation > 0 ? `₹${finalDonation}` : ''}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Minimum donation: ₹10
              </p>
            </div>

            {/* Thank You Card */}
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-pink-500/10 to-red-500/10 border-pink-500/20 animate-pulse-glow relative z-10">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-6 w-6 text-amber-500 mx-auto mb-2 animate-float" />
                <h3 className="font-semibold">Thank You!</h3>
                <p className="text-sm text-muted-foreground">
                  Your support means the world to me. Every donation helps improve 
                  the app and add new features for everyone.
                </p>
              </CardContent>
            </Card>

            {/* Payment Modal */}
            <MockPaymentModal
              isOpen={showDonationModal}
              onClose={() => setShowDonationModal(false)}
              amount={finalDonation}
              currency="₹"
              title="Support the Developer"
              description="Thank you for your generous donation!"
              onPaymentComplete={async (success, cardLastFour, errorMessage) => {
                // Save donation to database
                await processDonation.mutateAsync({
                  amount: finalDonation,
                  cardLastFour,
                  success,
                  errorMessage,
                });
                
                setShowDonationModal(false);
                if (success) {
                  triggerDonationConfetti();
                  toast({ title: "Thank You! 🎉", description: "Your donation was successful. We appreciate your support!" });
                  setSelectedDonation(null);
                  setCustomDonation("");
                } else {
                  toast({ title: "Payment Failed", description: errorMessage || "Please try again.", variant: "destructive" });
                }
              }}
            />

            {/* Donation History Section */}
            <div className="mt-12 max-w-3xl mx-auto relative z-10">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Your Contribution History
                  </CardTitle>
                  <CardDescription>
                    Thank you for your generous support over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {donationsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : donationHistory && donationHistory.length > 0 ? (
                    <div className="space-y-3">
                      {/* Total Donated Summary */}
                      <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-200 dark:border-pink-800 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Contributed</span>
                          <span className="text-xl font-bold text-primary">
                            ₹{donationHistory.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {donationHistory.length} donation{donationHistory.length > 1 ? 's' : ''} made
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => generateDonationSummary({
                              donorName: profile?.name || "Supporter",
                              donorEmail: profile?.email || "",
                              donations: donationHistory,
                              currency: "₹"
                            })}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Download Summary
                          </Button>
                        </div>
                      </div>
                      
                      {/* Individual Donations List */}
                      <div className="divide-y">
                        {donationHistory.map((donation) => (
                          <div key={donation.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30">
                                <Heart className="h-4 w-4 text-pink-500" />
                              </div>
                              <div>
                                <p className="font-medium">₹{donation.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Received
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => generateDonationReceipt({
                                  donorName: profile?.name || "Supporter",
                                  donorEmail: profile?.email || "",
                                  transactionId: donation.id,
                                  amount: donation.amount,
                                  currency: "₹",
                                  date: donation.created_at,
                                  cardLastFour: donation.card_last_four || undefined
                                })}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No donations yet</p>
                      <p className="text-sm">Your contributions will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }
    }
  };


  // Mobile Sidebar Content
  const SidebarContent = () => (
    <>
      <div className={cn(
        "p-4 border-b",
        isPremium && "border-amber-200/50 dark:border-amber-800/30"
      )}>
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/icon-192.png" alt="Logo" className="h-8 w-8 rounded-lg" />
          <span className={cn(
            "font-bold",
            isPremium && "text-gradient-gold"
          )}>ADSSIMSIM</span>
        </Link>
        {isPremium && (
          <Badge variant="premium" className="mt-2 gap-1">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]",
              activeSection === item.id
                ? isPremium 
                  ? "bg-gradient-premium text-white shadow-lg shadow-emerald-500/20"
                  : "bg-primary text-primary-foreground"
                : isPremium
                  ? "text-emerald-700 dark:text-emerald-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-4 w-4",
              activeSection === item.id && isPremium && "text-white"
            )} />
            {item.label}
            {isPremium && item.id === "subscription" && (
              <Star className="h-3 w-3 ml-auto text-amber-400" fill="currentColor" />
            )}
          </button>
        ))}
      </nav>

      {/* Premium User Profile in Sidebar */}
      {isPremium && (
        <div className="p-4 border-t border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative premium-sparkle">
              <Avatar className="h-10 w-10 premium-avatar-ring">
                <AvatarFallback className="bg-gradient-premium text-white font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gradient-gold">{profile?.name}</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 truncate">{profile?.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        "p-4 border-t",
        isPremium && "border-amber-200/50 dark:border-amber-800/30"
      )}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors min-h-[44px]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Golden glitter overlay — only visible for premium users */}
      {isPremium && <PremiumGlitter />}
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={cn(
            "w-64 border-r flex-col hidden lg:flex",
            isPremium ? "premium-sidebar" : "bg-card"
          )}
        >
          <SidebarContent />
        </motion.aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b bg-background/95 backdrop-blur-lg flex items-center justify-between px-4">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className={cn(
                "h-full flex flex-col",
                isPremium ? "premium-sidebar" : "bg-card"
              )}>
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          
          <span className={cn(
            "font-semibold",
            isPremium && "text-gradient-gold"
          )}>
            {sidebarItems.find(item => item.id === activeSection)?.label || "Dashboard"}
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
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-h-[40px]",
                  activeSection === item.id
                    ? isPremium 
                      ? "bg-gradient-premium text-white"
                      : "bg-primary text-primary-foreground"
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
          "flex-1 p-4 lg:p-8 overflow-auto",
          "pt-[120px] lg:pt-0", // Account for mobile header + tabs
          isPremium && "bg-gradient-premium-subtle"
        )}>
          <PullToRefresh onRefresh={handleRefresh}>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </PullToRefresh>
        </main>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw. Minimum withdrawal is ₹100.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={100}
                max={walletBalance}
              />
              <p className="text-sm text-muted-foreground">
                Available balance: ₹{walletBalance.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isProcessingWithdraw}>
              {isProcessingWithdraw ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="Phone number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={profileForm.gender}
                  onValueChange={(value) => setProfileForm({ ...profileForm, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  placeholder="Age"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Payment Modal */}
      <MockPaymentModal
        isOpen={showSubscriptionPaymentModal}
        onClose={() => setShowSubscriptionPaymentModal(false)}
        amount={selectedPlanData?.price || 0}
        title="Subscribe to Premium"
        description={`${selectedPlanData?.name} Plan - ₹${selectedPlanData?.price}/${selectedPlanData?.period}`}
        onPaymentComplete={handleSubscriptionPayment}
      />
    </>
  );
}
