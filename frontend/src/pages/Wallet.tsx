import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  TrendingUp,
  Crown,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cashbackTransactions, walletBalance } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { profile } = useAuth();
  const isPremium = profile?.is_premium;

  const handleWithdraw = () => {
    if (walletBalance.approved < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      toast.success("Withdrawal request submitted!", {
        description: "Amount will be credited within 24-48 hours.",
      });
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-pending" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "withdrawn":
        return <ArrowUpRight className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="pending">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "withdrawn":
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">
            My Wallet
          </h1>
          <p className="text-muted-foreground">
            Track your earnings and withdraw your cashback
          </p>
        </motion.div>

        {/* Balance Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Card variant="accent" className={cn(
            "relative overflow-hidden",
            isPremium && "border-yellow-500/30"
          )}>
            <div className={cn(
              "absolute -right-6 -top-6 h-24 w-24 rounded-full",
              isPremium ? "bg-yellow-500/15" : "bg-primary/10"
            )} />
            {isPremium && (
              <div className="absolute top-2 right-2">
                <Badge className="premium-bonus-badge text-[10px] px-1.5 py-0.5">
                  <Crown className="h-3 w-3 mr-0.5" />
                  Premium
                </Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isPremium ? "text-yellow-700 dark:text-yellow-400" : "text-muted-foreground"
              )}>
                <Wallet className="h-4 w-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn(
                "font-display text-3xl font-bold",
                isPremium ? "text-gradient-gold" : "text-primary"
              )}>
                ₹{walletBalance.approved.toLocaleString()}
              </p>
              <Button
                size="sm"
                className={cn(
                  "mt-4 w-full",
                  isPremium && "bg-gradient-premium-gold hover:opacity-90"
                )}
                onClick={handleWithdraw}
                disabled={isWithdrawing || walletBalance.approved < 100}
              >
                {isWithdrawing ? "Processing..." : "Withdraw"}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Pending Cashback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-pending">
                ₹{walletBalance.pending.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Usually confirmed in 30-90 days
              </p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Banknote className="h-4 w-4" />
                Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">
                ₹{walletBalance.totalWithdrawn.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-success">
                ₹
                {(
                  walletBalance.approved +
                  walletBalance.pending +
                  walletBalance.totalWithdrawn
                ).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Including all cashback
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {cashbackTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 font-display text-lg font-semibold">No Transactions Yet</h3>
                  <p className="text-muted-foreground">
                    Your cashback transactions will appear here once you start earning.
                  </p>
                </div>
              ) : (
                cashbackTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="default">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                          <img
                            src={transaction.brandLogo}
                            alt={transaction.brandName}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${transaction.brandName}&background=10b981&color=fff`;
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {transaction.brandName}
                            </h3>
                            {getStatusIcon(transaction.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-display text-lg font-bold ${
                              transaction.status === "rejected"
                                ? "text-destructive line-through"
                                : transaction.status === "approved"
                                ? "text-success"
                                : ""
                            }`}
                          >
                            {transaction.status === "rejected" ? "-" : "+"}₹
                            {transaction.amount}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {cashbackTransactions.filter((t) => t.status === "pending").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No pending transactions</p>
                </div>
              ) : (
                cashbackTransactions
                  .filter((t) => t.status === "pending")
                  .map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card variant="default">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                            <img
                              src={transaction.brandLogo}
                              alt={transaction.brandName}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {transaction.brandName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg font-bold">
                              +₹{transaction.amount}
                            </p>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {cashbackTransactions.filter((t) => t.status === "approved").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No approved transactions</p>
                </div>
              ) : (
                cashbackTransactions
                  .filter((t) => t.status === "approved")
                  .map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card variant="default">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                            <img
                              src={transaction.brandLogo}
                              alt={transaction.brandName}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {transaction.brandName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg font-bold text-success">
                              +₹{transaction.amount}
                            </p>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {cashbackTransactions.filter((t) => t.status === "rejected").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <XCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No rejected transactions</p>
                </div>
              ) : (
                cashbackTransactions
                  .filter((t) => t.status === "rejected")
                  .map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card variant="default">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                            <img
                              src={transaction.brandLogo}
                              alt={transaction.brandName}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {transaction.brandName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg font-bold text-destructive line-through">
                              ₹{transaction.amount}
                            </p>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
}
