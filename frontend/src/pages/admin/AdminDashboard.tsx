import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  Wallet,
  AlertTriangle,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Trash2,
  Search,
  X,
  Loader2,
  Activity,
  MessageSquare,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStats, useAdminUsers, useAdminCompanies } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardSkeleton } from "@/components/skeletons";
import { ConversionsManager } from "@/components/admin/ConversionsManager";
import { WebhookLogs } from "@/components/admin/WebhookLogs";
import { SchedulerManager } from "@/components/admin/SchedulerManager";
import { FraudDashboard } from "@/components/admin/FraudDashboard";
import { SupportManager } from "@/components/admin/SupportManager";
import { usePendingConversions } from "@/hooks/useConversionVerification";
import { useFraudStats } from "@/hooks/useFraudPrevention";
import { useOpenTicketsCount } from "@/hooks/useSupportTickets";

const pendingVerifications: Array<{
  id: string;
  brandName: string;
  website: string;
  submittedAt: string;
  status: string;
}> = [];

const recentWithdrawals: Array<{
  id: string;
  userName: string;
  amount: number;
  status: string;
  method: string;
  requestedAt: string;
}> = [];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  
  // Supabase hooks
  const { stats: adminStats, isLoading: statsLoading } = useAdminStats();
  const { users, isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const { companies, isLoading: companiesLoading, refetch: refetchCompanies } = useAdminCompanies();
  const { data: pendingConversions } = usePendingConversions();
  const { data: fraudStats } = useFraudStats();
  const { data: openTicketsCount } = useOpenTicketsCount();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "user" | "company";
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search and filter state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userCountryFilter, setUserCountryFilter] = useState("all");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState("all");

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Get unique countries and categories for filters
  const uniqueCountries = useMemo(() => {
    const countries = (users || []).map((u) => u.country).filter(Boolean) as string[];
    return [...new Set(countries)].sort();
  }, [users]);

  const uniqueCategories = useMemo(() => {
    const categories = (companies || []).map((c) => c.category).filter(Boolean) as string[];
    return [...new Set(categories)].sort();
  }, [companies]);

  // Filtered data
  const filteredUsers = useMemo(() => {
    return (users || []).filter((user) => {
      const matchesSearch =
        userSearchQuery === "" ||
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (user.phone && user.phone.includes(userSearchQuery));

      const matchesCountry =
        userCountryFilter === "all" || user.country === userCountryFilter;

      return matchesSearch && matchesCountry;
    });
  }, [users, userSearchQuery, userCountryFilter]);

  const filteredCompanies = useMemo(() => {
    return (companies || []).filter((company) => {
      const matchesSearch =
        companySearchQuery === "" ||
        company.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
        company.email.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
        (company.website &&
          company.website.toLowerCase().includes(companySearchQuery.toLowerCase()));

      const matchesCategory =
        companyCategoryFilter === "all" || company.category === companyCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [companies, companySearchQuery, companyCategoryFilter]);

  const clearUserFilters = () => {
    setUserSearchQuery("");
    setUserCountryFilter("all");
  };

  const clearCompanyFilters = () => {
    setCompanySearchQuery("");
    setCompanyCategoryFilter("all");
  };

  const isUserFiltersActive = userSearchQuery !== "" || userCountryFilter !== "all";
  const isCompanyFiltersActive = companySearchQuery !== "" || companyCategoryFilter !== "all";

  const stats = [
    {
      title: "Total Users",
      value: adminStats?.totalUsers?.toString() || "0",
      change: "--",
      icon: Users,
    },
    {
      title: "Active Brands",
      value: adminStats?.totalCompanies?.toString() || "0",
      change: "--",
      icon: Building2,
    },
    {
      title: "Monthly Payouts",
      value: `₹${(adminStats?.monthlyPayouts || 0).toLocaleString()}`,
      change: "--",
      icon: DollarSign,
    },
    {
      title: "Pending Reviews",
      value: adminStats?.pendingReviews?.toString() || "0",
      change: "--",
      icon: Clock,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const handleApprove = (id: string, type: string) => {
    toast.success(`${type} approved successfully`);
  };

  const handleReject = (id: string, type: string) => {
    toast.error(`${type} rejected`);
  };

  const openDeleteDialog = (
    id: string,
    type: "user" | "company",
    name: string
  ) => {
    setItemToDelete({ id, type, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.type === "user") {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', itemToDelete.id);
        
        if (error) throw error;
        toast.success(`User "${itemToDelete.name}" deleted successfully`);
        refetchUsers();
      } else {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', itemToDelete.id);
        
        if (error) throw error;
        toast.success(`Company "${itemToDelete.name}" deleted successfully`);
        refetchCompanies();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Loading state
  if (authLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  const renderDashboardContent = () => (
    <>
      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="default">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <p className="font-display text-3xl font-bold">{stat.value}</p>
                    <p className="mt-1 text-sm text-success">{stat.change}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Brand Verifications */}
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Pending Brand Verifications
            </CardTitle>
            <Badge variant="accent">{pendingVerifications.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingVerifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No pending verifications</p>
              </div>
            ) : (
              pendingVerifications.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{brand.brandName}</p>
                    <p className="text-sm text-muted-foreground">
                      {brand.website}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted:{" "}
                      {new Date(brand.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(brand.id, "Brand")}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(brand.id, "Brand")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-warning" />
              Pending Withdrawals
            </CardTitle>
            <Badge variant="warning">{recentWithdrawals.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentWithdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Wallet className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No pending withdrawals</p>
              </div>
            ) : (
              recentWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{withdrawal.userName}</p>
                    <p className="text-lg font-bold text-primary">
                      ₹{withdrawal.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {withdrawal.method} •{" "}
                      {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(withdrawal.id, "Withdrawal")}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(withdrawal.id, "Withdrawal")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderUsersContent = () => (
    <Card variant="default">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Registered Users
        </CardTitle>
        <Badge variant="accent">
          {isUserFiltersActive
            ? `${filteredUsers.length} of ${users?.length || 0}`
            : users?.length || 0}
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={userCountryFilter} onValueChange={setUserCountryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {uniqueCountries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isUserFiltersActive && (
            <Button variant="outline" size="sm" onClick={clearUserFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !users || users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No registered users
            </p>
            <p className="text-sm text-muted-foreground">
              Users will appear here once they sign up
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No users found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.country || "-"}</TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        openDeleteDialog(user.id, "user", user.name)
                      }
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderBrandsContent = () => (
    <Card variant="default">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Registered Companies
        </CardTitle>
        <Badge variant="accent">
          {isCompanyFiltersActive
            ? `${filteredCompanies.length} of ${companies?.length || 0}`
            : companies?.length || 0}
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or website..."
              value={companySearchQuery}
              onChange={(e) => setCompanySearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={companyCategoryFilter} onValueChange={setCompanyCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCompanyFiltersActive && (
            <Button variant="outline" size="sm" onClick={clearCompanyFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {companiesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !companies || companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No registered companies
            </p>
            <p className="text-sm text-muted-foreground">
              Companies will appear here once they sign up
            </p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No companies found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    {company.name}
                  </TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>{company.website || "-"}</TableCell>
                  <TableCell>{company.category || "-"}</TableCell>
                  <TableCell>{company.gst_number || "-"}</TableCell>
                  <TableCell>
                    {company.created_at ? new Date(company.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        openDeleteDialog(
                          company.id,
                          "company",
                          company.name
                        )
                      }
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderPlaceholderContent = (title: string) => (
    <Card variant="default">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Settings className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <p className="text-xl font-medium text-muted-foreground">
          {title} Coming Soon
        </p>
        <p className="text-sm text-muted-foreground">
          This feature is under development
        </p>
      </CardContent>
    </Card>
  );

  const getPageTitle = () => {
    switch (activeTab) {
      case "users":
        return "User Management";
      case "brands":
        return "Brand Management";
      case "conversions":
        return "Conversion Tracking";
      case "support":
        return "Support Tickets";
      case "scheduler":
        return "Scheduled Jobs";
      case "offers":
        return "Offer Management";
      case "withdrawals":
        return "Withdrawal Management";
      case "fraud":
        return "Fraud Monitor";
      case "settings":
        return "Settings";
      default:
        return "Admin Dashboard";
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case "users":
        return "View and manage all registered users";
      case "brands":
        return "View and manage all registered companies";
      case "conversions":
        return "Track, verify, and simulate user conversions";
      case "support":
        return "Manage user support tickets and respond to inquiries";
      case "scheduler":
        return "View scheduled jobs and execution history";
      case "offers":
        return "Manage platform offers and promotions";
      case "withdrawals":
        return "Review and process withdrawal requests";
      case "fraud":
        return "Monitor suspicious activities";
      case "settings":
        return "Configure platform settings";
      default:
        return "Manage users, brands, and platform settings";
    }
  };

  const renderConversionsContent = () => (
    <div className="space-y-6">
      <ConversionsManager />
      <WebhookLogs />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Admin Panel</span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {[
              { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
              { id: "users", icon: Users, label: "Users" },
              { id: "brands", icon: Building2, label: "Brands" },
              { id: "conversions", icon: Activity, label: "Conversions" },
              { id: "support", icon: MessageSquare, label: "Support" },
              { id: "scheduler", icon: Clock, label: "Scheduler" },
              { id: "offers", icon: Tag, label: "Offers" },
              { id: "withdrawals", icon: Wallet, label: "Withdrawals" },
              { id: "fraud", icon: AlertTriangle, label: "Fraud Monitor" },
              { id: "settings", icon: Settings, label: "Settings" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.id === "users" && users && users.length > 0 && (
                  <Badge variant="accent" className="ml-auto">
                    {users.length}
                  </Badge>
                )}
                {item.id === "brands" && companies && companies.length > 0 && (
                  <Badge variant="accent" className="ml-auto">
                    {companies.length}
                  </Badge>
                )}
                {item.id === "conversions" && pendingConversions && pendingConversions.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingConversions.length}
                  </Badge>
                )}
                {item.id === "fraud" && (fraudStats?.criticalRisk || 0) > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {fraudStats.criticalRisk}
                  </Badge>
                )}
                {item.id === "support" && (openTicketsCount || 0) > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {openTicketsCount}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeTab}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">{getPageTitle()}</h1>
            <p className="text-muted-foreground">{getPageDescription()}</p>
          </div>

          {/* Content based on active tab */}
          {activeTab === "dashboard" && renderDashboardContent()}
          {activeTab === "users" && renderUsersContent()}
          {activeTab === "brands" && renderBrandsContent()}
          {activeTab === "conversions" && renderConversionsContent()}
          {activeTab === "support" && <SupportManager />}
          {activeTab === "scheduler" && <SchedulerManager />}
          {activeTab === "offers" && renderPlaceholderContent("Offers")}
          {activeTab === "withdrawals" &&
            renderPlaceholderContent("Withdrawals")}
          {activeTab === "fraud" && <FraudDashboard />}
          {activeTab === "settings" && renderPlaceholderContent("Settings")}
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">{itemToDelete?.name}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
