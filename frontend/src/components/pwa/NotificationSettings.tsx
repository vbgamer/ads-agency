import { Bell, BellOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
  isPremium?: boolean;
  compact?: boolean;
}

export function NotificationSettings({ isPremium = false, compact = false }: NotificationSettingsProps) {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    isLoading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  // Not supported message
  if (!isSupported) {
    if (compact) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Push notifications not supported
          </span>
        </div>
      );
    }

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-full">
              <BellOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Your browser doesn't support push notifications. Try using Chrome, Firefox, or Edge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Permission denied message
  if (permission === 'denied') {
    if (compact) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-destructive">
            Notifications blocked - enable in browser settings
          </span>
        </div>
      );
    }

    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium">Notifications Blocked</h3>
              <p className="text-sm text-muted-foreground">
                You've blocked notifications. To enable them, go to your browser settings and allow notifications for this site.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact mode for dashboard tips
  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors",
          isSubscribed 
            ? "bg-primary/10" 
            : "bg-muted/50 hover:bg-muted"
        )}
        onClick={() => !isLoading && handleToggle(!isSubscribed)}
      >
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <span className="text-sm font-medium">
              {isSubscribed ? 'Notifications enabled' : 'Enable notifications'}
            </span>
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? 'You\'ll receive deal alerts' : 'Never miss a deal'}
            </p>
          </div>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Switch 
            checked={isSubscribed} 
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    );
  }

  // Full card mode
  return (
    <Card className={cn(isPremium && "premium-card border-premium-gold")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isSubscribed ? "bg-primary/10" : "bg-muted"
            )}>
              <Bell className={cn(
                "h-5 w-5",
                isSubscribed ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className={cn(
                "text-lg",
                isPremium && "text-gradient-gold"
              )}>
                Push Notifications
              </CardTitle>
              <CardDescription>
                Get notified about deals and cashback updates
              </CardDescription>
            </div>
          </div>
          {isSubscribed && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isSubscribed ? 'Notifications are enabled' : 'Enable notifications'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? "You'll receive alerts for new deals, cashback confirmations, and wallet updates" 
                : "Stay updated with new deals and cashback notifications"}
            </p>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch 
              checked={isSubscribed} 
              onCheckedChange={handleToggle}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
