import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FraudTrendData {
  date: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avg_risk_score: number;
}

export interface RuleEffectivenessData {
  rule_id: string;
  rule_name: string;
  rule_type: string;
  times_triggered: number;
  resolved_count: number;
  unresolved_count: number;
  resolution_rate: number;
}

export interface RiskDistributionData {
  severity: string;
  count: number;
  percentage: number;
}

export interface DetectionOutcomeData {
  date: string;
  verified: number;
  rejected: number;
  auto_rejected: number;
  pending: number;
}

export interface FlagTypeData {
  flag_type: string;
  count: number;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function useFraudTrends(days: number = 30) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["fraud-trends", days],
    queryFn: async () => {
      // Get daily fraud flag counts by severity
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: flags, error } = await supabase
        .from("fraud_flags")
        .select("created_at, severity")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyData = new Map<string, FraudTrendData>();

      // Initialize all dates in range
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateKey = date.toISOString().split("T")[0];
        dailyData.set(dateKey, {
          date: dateKey,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          avg_risk_score: 0,
        });
      }

      // Aggregate flags by date
      flags?.forEach((flag) => {
        const dateKey = new Date(flag.created_at).toISOString().split("T")[0];
        const existing = dailyData.get(dateKey);
        if (existing) {
          existing.total += 1;
          if (flag.severity === "critical") existing.critical += 1;
          else if (flag.severity === "high") existing.high += 1;
          else if (flag.severity === "medium") existing.medium += 1;
          else existing.low += 1;
        }
      });

      return Array.from(dailyData.values());
    },
    enabled: isAdmin,
    staleTime: 60000, // 1 minute
  });
}

export function useRuleEffectiveness() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["rule-effectiveness"],
    queryFn: async () => {
      // Get all rules
      const { data: rules, error: rulesError } = await supabase
        .from("fraud_rules")
        .select("id, name, rule_type");

      if (rulesError) throw rulesError;

      // Get flag counts per rule
      const { data: flags, error: flagsError } = await supabase
        .from("fraud_flags")
        .select("rule_id, resolved");

      if (flagsError) throw flagsError;

      // Aggregate by rule
      const ruleStats = new Map<string, { resolved: number; unresolved: number }>();

      flags?.forEach((flag) => {
        if (!flag.rule_id) return;
        const existing = ruleStats.get(flag.rule_id) || { resolved: 0, unresolved: 0 };
        if (flag.resolved) {
          existing.resolved += 1;
        } else {
          existing.unresolved += 1;
        }
        ruleStats.set(flag.rule_id, existing);
      });

      const result: RuleEffectivenessData[] = rules?.map((rule) => {
        const stats = ruleStats.get(rule.id) || { resolved: 0, unresolved: 0 };
        const total = stats.resolved + stats.unresolved;
        return {
          rule_id: rule.id,
          rule_name: rule.name,
          rule_type: rule.rule_type,
          times_triggered: total,
          resolved_count: stats.resolved,
          unresolved_count: stats.unresolved,
          resolution_rate: total > 0 ? (stats.resolved / total) * 100 : 0,
        };
      }) || [];

      // Sort by times triggered
      return result.sort((a, b) => b.times_triggered - a.times_triggered);
    },
    enabled: isAdmin,
    staleTime: 60000,
  });
}

export function useRiskDistribution() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["risk-distribution"],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from("cashback_transactions")
        .select("risk_score")
        .not("risk_score", "is", null);

      if (error) throw error;

      const distribution = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      };

      transactions?.forEach((tx) => {
        const score = tx.risk_score || 0;
        if (score >= 70) distribution.critical += 1;
        else if (score >= 40) distribution.high += 1;
        else if (score >= 20) distribution.medium += 1;
        else distribution.low += 1;
      });

      const total = Object.values(distribution).reduce((a, b) => a + b, 0);

      const result: RiskDistributionData[] = [
        { severity: "low", count: distribution.low, percentage: total > 0 ? (distribution.low / total) * 100 : 0 },
        { severity: "medium", count: distribution.medium, percentage: total > 0 ? (distribution.medium / total) * 100 : 0 },
        { severity: "high", count: distribution.high, percentage: total > 0 ? (distribution.high / total) * 100 : 0 },
        { severity: "critical", count: distribution.critical, percentage: total > 0 ? (distribution.critical / total) * 100 : 0 },
      ].filter((item) => item.count > 0);

      return result;
    },
    enabled: isAdmin,
    staleTime: 60000,
  });
}

export function useDetectionOutcomes(days: number = 30) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["detection-outcomes", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: transactions, error } = await supabase
        .from("cashback_transactions")
        .select("created_at, verification_status, auto_verified")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyData = new Map<string, DetectionOutcomeData>();

      // Initialize all dates
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateKey = date.toISOString().split("T")[0];
        dailyData.set(dateKey, {
          date: dateKey,
          verified: 0,
          rejected: 0,
          auto_rejected: 0,
          pending: 0,
        });
      }

      // Aggregate transactions
      transactions?.forEach((tx) => {
        const dateKey = new Date(tx.created_at).toISOString().split("T")[0];
        const existing = dailyData.get(dateKey);
        if (existing) {
          if (tx.verification_status === "verified") {
            existing.verified += 1;
          } else if (tx.verification_status === "rejected") {
            if (tx.auto_verified) {
              existing.auto_rejected += 1;
            } else {
              existing.rejected += 1;
            }
          } else {
            existing.pending += 1;
          }
        }
      });

      return Array.from(dailyData.values());
    },
    enabled: isAdmin,
    staleTime: 60000,
  });
}

export function useFlagTypeDistribution() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["flag-type-distribution"],
    queryFn: async () => {
      const { data: flags, error } = await supabase
        .from("fraud_flags")
        .select("flag_type, severity");

      if (error) throw error;

      // Group by flag type
      const typeStats = new Map<string, FlagTypeData>();

      flags?.forEach((flag) => {
        const existing = typeStats.get(flag.flag_type) || {
          flag_type: flag.flag_type,
          count: 0,
          severity_breakdown: { critical: 0, high: 0, medium: 0, low: 0 },
        };
        
        existing.count += 1;
        if (flag.severity === "critical") existing.severity_breakdown.critical += 1;
        else if (flag.severity === "high") existing.severity_breakdown.high += 1;
        else if (flag.severity === "medium") existing.severity_breakdown.medium += 1;
        else existing.severity_breakdown.low += 1;
        
        typeStats.set(flag.flag_type, existing);
      });

      return Array.from(typeStats.values()).sort((a, b) => b.count - a.count);
    },
    enabled: isAdmin,
    staleTime: 60000,
  });
}
