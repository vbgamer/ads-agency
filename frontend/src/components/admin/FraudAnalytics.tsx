import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Download, TrendingUp, TrendingDown, BarChart3, PieChartIcon, Activity } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  useFraudTrends,
  useRuleEffectiveness,
  useRiskDistribution,
  useDetectionOutcomes,
  useFlagTypeDistribution,
} from "@/hooks/useFraudAnalytics";

const trendChartConfig: ChartConfig = {
  critical: { label: "Critical", color: "hsl(0, 84%, 60%)" },
  high: { label: "High", color: "hsl(25, 95%, 53%)" },
  medium: { label: "Medium", color: "hsl(48, 96%, 53%)" },
  low: { label: "Low", color: "hsl(142, 71%, 45%)" },
};

const outcomeChartConfig: ChartConfig = {
  verified: { label: "Verified", color: "hsl(142, 71%, 45%)" },
  rejected: { label: "Rejected", color: "hsl(0, 84%, 60%)" },
  auto_rejected: { label: "Auto-Rejected", color: "hsl(280, 65%, 60%)" },
};

const SEVERITY_COLORS = {
  critical: "hsl(0, 84%, 60%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(48, 96%, 53%)",
  low: "hsl(142, 71%, 45%)",
};

const PIE_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(48, 96%, 53%)",
  "hsl(25, 95%, 53%)",
  "hsl(0, 84%, 60%)",
];

export function FraudAnalytics() {
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const days = parseInt(dateRange);

  const { data: trendsData, isLoading: trendsLoading, refetch: refetchTrends } = useFraudTrends(days);
  const { data: ruleData, isLoading: ruleLoading, refetch: refetchRules } = useRuleEffectiveness();
  const { data: riskData, isLoading: riskLoading, refetch: refetchRisk } = useRiskDistribution();
  const { data: outcomeData, isLoading: outcomeLoading, refetch: refetchOutcomes } = useDetectionOutcomes(days);
  const { data: flagTypeData, isLoading: flagTypeLoading, refetch: refetchFlagTypes } = useFlagTypeDistribution();

  const handleRefresh = () => {
    refetchTrends();
    refetchRules();
    refetchRisk();
    refetchOutcomes();
    refetchFlagTypes();
  };

  const handleExport = () => {
    const exportData = {
      trends: trendsData,
      ruleEffectiveness: ruleData,
      riskDistribution: riskData,
      outcomes: outcomeData,
      flagTypes: flagTypeData,
      exportedAt: new Date().toISOString(),
      dateRange: `Last ${days} days`,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = (trendsData?.length ?? 0) > 0 || (ruleData?.length ?? 0) > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7" | "30" | "90")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!hasData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {!hasData && !trendsLoading && !ruleLoading && (
        <motion.div variants={itemVariants}>
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Fraud Activity Detected Yet</h3>
              <p className="text-muted-foreground max-w-md">
                Charts will populate as transactions are processed through the fraud detection system.
                Try simulating a conversion to see the analytics in action.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Fraud Trends Over Time */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Fraud Trends Over Time</CardTitle>
            </div>
            <CardDescription>Daily flagged transactions by risk severity</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : trendsData && trendsData.length > 0 ? (
              <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                <AreaChart data={trendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="low"
                    stackId="1"
                    stroke="var(--color-low)"
                    fill="var(--color-low)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="medium"
                    stackId="1"
                    stroke="var(--color-medium)"
                    fill="var(--color-medium)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="high"
                    stackId="1"
                    stroke="var(--color-high)"
                    fill="var(--color-high)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    stackId="1"
                    stroke="var(--color-critical)"
                    fill="var(--color-critical)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle>Risk Score Distribution</CardTitle>
              </div>
              <CardDescription>Current breakdown by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              {riskLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : riskData && riskData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="severity"
                        label={({ severity, percent }) => `${severity}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {riskData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SEVERITY_COLORS[entry.severity as keyof typeof SEVERITY_COLORS] || PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No distribution data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Rule Effectiveness */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Rule Effectiveness</CardTitle>
              </div>
              <CardDescription>Times each rule was triggered</CardDescription>
            </CardHeader>
            <CardContent>
              {ruleLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : ruleData && ruleData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ruleData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                      <XAxis type="number" className="text-xs" />
                      <YAxis
                        dataKey="rule_name"
                        type="category"
                        width={100}
                        className="text-xs"
                        tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="resolved_count" stackId="a" fill="hsl(142, 71%, 45%)" name="Resolved" />
                      <Bar dataKey="unresolved_count" stackId="a" fill="hsl(25, 95%, 53%)" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No rule data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detection Outcomes Over Time */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              <CardTitle>Detection Outcomes Over Time</CardTitle>
            </div>
            <CardDescription>Verification decisions trend</CardDescription>
          </CardHeader>
          <CardContent>
            {outcomeLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : outcomeData && outcomeData.length > 0 ? (
              <ChartContainer config={outcomeChartConfig} className="h-[300px] w-full">
                <LineChart data={outcomeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="verified"
                    stroke="var(--color-verified)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="var(--color-rejected)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="auto_rejected"
                    stroke="var(--color-auto_rejected)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No outcome data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Flag Type Distribution */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Flag Type Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of fraud detection triggers</CardDescription>
          </CardHeader>
          <CardContent>
            {flagTypeLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : flagTypeData && flagTypeData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flagTypeData} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                    <XAxis type="number" className="text-xs" />
                    <YAxis
                      dataKey="flag_type"
                      type="category"
                      width={150}
                      className="text-xs"
                      tickFormatter={(value) => value.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [value, "Count"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No flag type data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
