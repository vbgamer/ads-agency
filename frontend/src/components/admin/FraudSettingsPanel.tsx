import { useState, useEffect } from "react";
import { Save, RefreshCw, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  useFraudSettings, 
  useUpdateFraudSettings,
  useNotificationSettings,
  useUpdateNotificationSettings,
  type FraudSettings,
} from "@/hooks/useFraudPrevention";

export function FraudSettingsPanel() {
  const { data: settings, isLoading, refetch } = useFraudSettings();
  const { mutate: updateSettings, isPending } = useUpdateFraudSettings();
  const { data: notificationSettings, isLoading: notifLoading } = useNotificationSettings();
  const { mutate: updateNotificationSettings, isPending: notifPending } = useUpdateNotificationSettings();
  
  const [formData, setFormData] = useState<Partial<FraudSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        default_hold_days: settings.default_hold_days,
        high_risk_hold_days: settings.high_risk_hold_days,
        critical_risk_hold_days: settings.critical_risk_hold_days,
        max_conversions_per_user_per_day: settings.max_conversions_per_user_per_day,
        max_conversions_per_user_per_campaign: settings.max_conversions_per_user_per_campaign,
        auto_reject_risk_threshold: settings.auto_reject_risk_threshold,
        auto_verify_risk_threshold: settings.auto_verify_risk_threshold,
      });
      setHasChanges(false);
    }
  }, [settings]);

  const handleChange = (key: keyof FraudSettings, value: string) => {
    const numValue = value === "" ? null : Number(value);
    setFormData(prev => ({ ...prev, [key]: numValue }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        default_hold_days: settings.default_hold_days,
        high_risk_hold_days: settings.high_risk_hold_days,
        critical_risk_hold_days: settings.critical_risk_hold_days,
        max_conversions_per_user_per_day: settings.max_conversions_per_user_per_day,
        max_conversions_per_user_per_campaign: settings.max_conversions_per_user_per_campaign,
        auto_reject_risk_threshold: settings.auto_reject_risk_threshold,
        auto_verify_risk_threshold: settings.auto_verify_risk_threshold,
      });
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fraud Prevention Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure global thresholds and hold periods for fraud prevention
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hold Periods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hold Periods</CardTitle>
            <CardDescription>
              How long to hold transactions before they can be auto-verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_hold">Default Hold (days)</Label>
              <Input
                id="default_hold"
                type="number"
                min={1}
                max={90}
                value={formData.default_hold_days ?? ""}
                onChange={(e) => handleChange("default_hold_days", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Standard hold period for low-risk transactions
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="high_risk_hold">High Risk Hold (days)</Label>
              <Input
                id="high_risk_hold"
                type="number"
                min={1}
                max={90}
                value={formData.high_risk_hold_days ?? ""}
                onChange={(e) => handleChange("high_risk_hold_days", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Extended hold for transactions with risk score 40-69
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="critical_hold">Critical Risk Hold (days)</Label>
              <Input
                id="critical_hold"
                type="number"
                min={1}
                max={90}
                value={formData.critical_risk_hold_days ?? ""}
                onChange={(e) => handleChange("critical_risk_hold_days", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum hold for transactions with risk score 70-89
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Thresholds</CardTitle>
            <CardDescription>
              Automatic actions based on fraud risk scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auto_reject">Auto-Reject Threshold</Label>
              <Input
                id="auto_reject"
                type="number"
                min={50}
                max={100}
                value={formData.auto_reject_risk_threshold ?? ""}
                onChange={(e) => handleChange("auto_reject_risk_threshold", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Automatically reject transactions with risk score at or above this value
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auto_verify">Auto-Verify Threshold</Label>
              <Input
                id="auto_verify"
                type="number"
                min={0}
                max={30}
                value={formData.auto_verify_risk_threshold ?? ""}
                onChange={(e) => handleChange("auto_verify_risk_threshold", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Mark transactions as low-risk if score is at or below this value
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Velocity Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Velocity Limits</CardTitle>
            <CardDescription>
              Control maximum conversion rates per user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max_per_day">Max Conversions Per Day</Label>
              <Input
                id="max_per_day"
                type="number"
                min={1}
                max={50}
                value={formData.max_conversions_per_user_per_day ?? ""}
                onChange={(e) => handleChange("max_conversions_per_user_per_day", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum conversions allowed per user per 24 hours
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_per_campaign">Max Per Campaign</Label>
              <Input
                id="max_per_campaign"
                type="number"
                min={1}
                max={10}
                value={formData.max_conversions_per_user_per_campaign ?? ""}
                onChange={(e) => handleChange("max_conversions_per_user_per_campaign", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum times a user can convert on the same campaign
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive alerts when fraud flags are detected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_enabled">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable all fraud alert emails
                    </p>
                  </div>
                  <Switch
                    id="email_enabled"
                    checked={notificationSettings?.email_enabled ?? true}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ email_enabled: checked })
                    }
                    disabled={notifPending}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify_high_risk">High Risk Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify when risk score is 40-69
                    </p>
                  </div>
                  <Switch
                    id="notify_high_risk"
                    checked={notificationSettings?.notify_high_risk ?? false}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ notify_high_risk: checked })
                    }
                    disabled={notifPending || !(notificationSettings?.email_enabled ?? true)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify_critical_risk">Critical Risk Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify when risk score is 70+
                    </p>
                  </div>
                  <Switch
                    id="notify_critical_risk"
                    checked={notificationSettings?.notify_critical_risk ?? true}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ notify_critical_risk: checked })
                    }
                    disabled={notifPending || !(notificationSettings?.email_enabled ?? true)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {hasChanges && (
        <div className="flex items-center justify-end gap-2 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mr-4">You have unsaved changes</p>
          <Button variant="outline" onClick={handleReset}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
