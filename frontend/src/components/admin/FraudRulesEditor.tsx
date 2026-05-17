import { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldOff,
  Edit,
  Save,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useFraudRules, 
  useUpdateFraudRule,
  type FraudRule,
} from "@/hooks/useFraudPrevention";

export function FraudRulesEditor() {
  const { data: rules, isLoading } = useFraudRules();
  const { mutate: updateRule, isPending } = useUpdateFraudRule();
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, unknown>>({});

  const handleToggle = (rule: FraudRule) => {
    updateRule({
      ruleId: rule.id,
      updates: { is_active: !rule.is_active },
    });
  };

  const handleEdit = (rule: FraudRule) => {
    setEditingRule(rule.id);
    setEditedParams(rule.parameters);
  };

  const handleSave = (rule: FraudRule) => {
    updateRule({
      ruleId: rule.id,
      updates: { parameters: editedParams },
    });
    setEditingRule(null);
    setEditedParams({});
  };

  const handleCancel = () => {
    setEditingRule(null);
    setEditedParams({});
  };

  const updateParam = (key: string, value: string) => {
    const numValue = Number(value);
    setEditedParams(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? value : numValue,
    }));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case "high":
        return <ShieldAlert className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <ShieldCheck className="h-5 w-5 text-yellow-500" />;
      default:
        return <ShieldOff className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "auto_reject":
        return <Badge variant="destructive">Auto-Reject</Badge>;
      case "extend_hold":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">Extend Hold</Badge>;
      default:
        return <Badge variant="secondary">Flag Only</Badge>;
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      velocity: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      duplicate: "bg-purple-500/20 text-purple-500 border-purple-500/30",
      pattern: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
      amount: "bg-green-500/20 text-green-500 border-green-500/30",
    };
    return (
      <Badge className={colors[type] || "bg-gray-500/20 text-gray-500 border-gray-500/30"}>
        {type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fraud Detection Rules</h3>
          <p className="text-sm text-muted-foreground">
            Configure which fraud patterns to detect and what actions to take
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rules?.map((rule) => (
          <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getSeverityIcon(rule.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{rule.name}</h4>
                    {getRuleTypeBadge(rule.rule_type)}
                    {getActionBadge(rule.action)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.description}
                  </p>
                  
                  {/* Parameters */}
                  {editingRule === rule.id ? (
                    <div className="mt-3 p-3 bg-secondary/50 rounded-lg space-y-3">
                      {Object.entries(editedParams).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Label className="min-w-[150px] text-xs">
                            {key.replace(/_/g, ' ')}
                          </Label>
                          <Input
                            type="number"
                            value={String(value)}
                            onChange={(e) => updateParam(key, e.target.value)}
                            className="h-8 w-32"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(rule)}
                          disabled={isPending}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={handleCancel}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : Object.keys(rule.parameters).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(rule.parameters).map(([key, value]) => (
                        <span 
                          key={key} 
                          className="text-xs bg-secondary px-2 py-1 rounded"
                        >
                          {key.replace(/_/g, ' ')}: <strong>{String(value)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {Object.keys(rule.parameters).length > 0 && editingRule !== rule.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => handleToggle(rule)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
