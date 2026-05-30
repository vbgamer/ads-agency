import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Plus, Settings, Trash2, RefreshCw, Copy, Check, 
  ExternalLink, ShoppingBag, ShoppingCart, Plug,
  AlertCircle, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useStoreIntegrations, 
  useIntegrationEvents,
  getWebhookUrl,
  PLATFORM_INFO,
  EVENT_TYPE_INFO,
  type IntegrationPlatform,
  type OrderEventType,
  type StoreIntegration
} from '@/hooks/useStoreIntegrations';
import { cn } from '@/lib/utils';

const PLATFORM_ICONS: Record<IntegrationPlatform, React.ReactNode> = {
  shopify: <ShoppingBag className="h-6 w-6" />,
  woocommerce: <ShoppingCart className="h-6 w-6" />,
  custom_api: <Plug className="h-6 w-6" />
};

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
  connected: { color: 'bg-green-500', icon: CheckCircle, label: 'Connected' },
  disconnected: { color: 'bg-gray-500', icon: XCircle, label: 'Disconnected' },
  error: { color: 'bg-red-500', icon: AlertCircle, label: 'Error' }
};

export function StoreIntegrationsPanel() {
  const { 
    integrations, 
    isLoading, 
    createIntegration, 
    updateIntegration, 
    deleteIntegration, 
    regenerateWebhookSecret,
    initiateShopifyOAuth,
    connectWooCommerce,
    disconnectIntegration
  } = useStoreIntegrations();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<IntegrationPlatform | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<StoreIntegration | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null);

  // Check for OAuth callback success/error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    
    if (success === 'shopify_connected') {
      toast.success('Shopify store connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'missing_params': 'OAuth callback missing required parameters',
        'invalid_state': 'Invalid OAuth state. Please try again.',
        'state_expired': 'OAuth session expired. Please try again.',
        'token_exchange_failed': 'Failed to connect to Shopify. Please try again.',
        'save_failed': 'Failed to save integration. Please try again.',
      };
      toast.error(errorMessages[error] || 'Connection failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const availablePlatforms = (['shopify', 'woocommerce', 'custom_api'] as IntegrationPlatform[]).filter(
    platform => !integrations?.some(i => i.platform === platform)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Store Integrations</h2>
          <p className="text-muted-foreground">
            Connect your e-commerce platforms for automatic order tracking and conversion verification
          </p>
        </div>
        {availablePlatforms.length > 0 && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Integration
          </Button>
        )}
      </div>

      {/* Integrations List */}
      {integrations && integrations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onSettings={() => setSelectedIntegration(integration)}
              onDelete={() => {
                setIntegrationToDelete(integration.id);
                setShowDeleteDialog(true);
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Integrations Yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Connect your e-commerce store to automatically track orders and verify conversions without sharing callback URLs.
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Store Integration</DialogTitle>
            <DialogDescription>
              Choose your e-commerce platform to get started
            </DialogDescription>
          </DialogHeader>
          
          {!selectedPlatform ? (
            <div className="grid gap-4 md:grid-cols-3 py-4">
              {availablePlatforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-transparent bg-muted/50 hover:border-primary hover:bg-muted transition-all"
                >
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {PLATFORM_ICONS[platform]}
                  </div>
                  <span className="font-semibold">{PLATFORM_INFO[platform].name}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {PLATFORM_INFO[platform].description}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <AddIntegrationForm
              platform={selectedPlatform}
              onSubmit={async (data) => {
                await createIntegration.mutateAsync({
                  platform: selectedPlatform,
                  ...data
                });
                setShowAddDialog(false);
                setSelectedPlatform(null);
              }}
              onCancel={() => setSelectedPlatform(null)}
              isLoading={createIntegration.isPending}
              onShopifyOAuth={async (shopUrl) => {
                await initiateShopifyOAuth.mutateAsync(shopUrl);
              }}
              onWooCommerceConnect={async (params) => {
                await connectWooCommerce.mutateAsync(params);
                setShowAddDialog(false);
                setSelectedPlatform(null);
              }}
              isOAuthLoading={initiateShopifyOAuth.isPending || connectWooCommerce.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      {selectedIntegration && (
        <IntegrationSettingsDialog
          integration={selectedIntegration}
          open={!!selectedIntegration}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          onUpdate={updateIntegration.mutateAsync}
          onRegenerateSecret={regenerateWebhookSecret.mutateAsync}
          isUpdating={updateIntegration.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the integration and stop tracking orders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (integrationToDelete) {
                  await deleteIntegration.mutateAsync(integrationToDelete);
                }
                setShowDeleteDialog(false);
                setIntegrationToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Integration Card Component
function IntegrationCard({ 
  integration, 
  onSettings, 
  onDelete 
}: { 
  integration: StoreIntegration; 
  onSettings: () => void;
  onDelete: () => void;
}) {
  const statusConfig = STATUS_CONFIG[integration.status];
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {PLATFORM_ICONS[integration.platform]}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {PLATFORM_INFO[integration.platform].name}
                </CardTitle>
                {integration.store_name && (
                  <CardDescription>{integration.store_name}</CardDescription>
                )}
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1",
                integration.status === 'connected' && "border-green-500 text-green-600",
                integration.status === 'error' && "border-red-500 text-red-600",
                integration.status === 'pending' && "border-yellow-500 text-yellow-600"
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tracked Events */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Tracked Events</p>
            <div className="flex flex-wrap gap-1">
              {integration.tracked_events.map((event) => (
                <Badge key={event} variant="secondary" className="text-xs">
                  {EVENT_TYPE_INFO[event].name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Auto Verify Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Auto-verify conversions</span>
            <Badge variant={integration.auto_verify_conversions ? "default" : "outline"}>
              {integration.auto_verify_conversions ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {/* Last Sync */}
          {integration.last_sync_at && (
            <p className="text-xs text-muted-foreground">
              Last sync: {new Date(integration.last_sync_at).toLocaleString()}
            </p>
          )}

          {/* Error Message */}
          {integration.error_message && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded">
              {integration.error_message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={onSettings}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Add Integration Form
function AddIntegrationForm({
  platform,
  onSubmit,
  onCancel,
  isLoading,
  onShopifyOAuth,
  onWooCommerceConnect,
  isOAuthLoading,
}: {
  platform: IntegrationPlatform;
  onSubmit: (data: { store_url?: string; api_endpoint?: string; tracked_events?: OrderEventType[] }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  onShopifyOAuth?: (shopUrl: string) => Promise<void>;
  onWooCommerceConnect?: (params: { store_url: string; consumer_key: string; consumer_secret: string }) => Promise<void>;
  isOAuthLoading?: boolean;
}) {
  const [storeUrl, setStoreUrl] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [trackedEvents, setTrackedEvents] = useState<OrderEventType[]>(['order_paid']);
  const [showCredentials, setShowCredentials] = useState(false);

  const toggleEvent = (event: OrderEventType) => {
    setTrackedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleSubmit = async () => {
    if (platform === 'shopify' && onShopifyOAuth) {
      await onShopifyOAuth(storeUrl);
    } else if (platform === 'woocommerce' && onWooCommerceConnect) {
      await onWooCommerceConnect({
        store_url: storeUrl,
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      });
    } else {
      await onSubmit({
        store_url: platform !== 'custom_api' ? storeUrl : undefined,
        api_endpoint: platform === 'custom_api' ? apiEndpoint : undefined,
        tracked_events: trackedEvents
      });
    }
  };

  const isFormValid = () => {
    if (platform === 'shopify') return storeUrl.trim().length > 0;
    if (platform === 'woocommerce') return storeUrl.trim().length > 0 && consumerKey.trim().length > 0 && consumerSecret.trim().length > 0;
    if (platform === 'custom_api') return trackedEvents.length > 0;
    return false;
  };

  return (
    <div className="space-y-6 py-4">
      {platform === 'shopify' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Shopify OAuth Connection</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              You'll be securely redirected to Shopify to authorize the connection. We'll only request access to read your orders.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Shopify Store URL</Label>
            <Input
              placeholder="your-store.myshopify.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter your store name (e.g., "mystore" or "mystore.myshopify.com")
            </p>
          </div>
        </div>
      )}

      {platform === 'woocommerce' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
            <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">WooCommerce API Keys</h4>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-2">
              Generate API keys from your WooCommerce dashboard:
            </p>
            <ol className="text-sm text-purple-700 dark:text-purple-400 list-decimal list-inside space-y-1">
              <li>Go to WooCommerce → Settings → Advanced → REST API</li>
              <li>Click "Add key" and set permissions to "Read"</li>
              <li>Copy the Consumer Key and Consumer Secret</li>
            </ol>
          </div>
          <div className="space-y-2">
            <Label>WooCommerce Store URL</Label>
            <Input
              placeholder="https://your-store.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Consumer Key</Label>
            <Input
              placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value)}
              type={showCredentials ? "text" : "password"}
            />
          </div>
          <div className="space-y-2">
            <Label>Consumer Secret</Label>
            <Input
              placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value)}
              type={showCredentials ? "text" : "password"}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-credentials"
              checked={showCredentials}
              onCheckedChange={(checked) => setShowCredentials(!!checked)}
            />
            <Label htmlFor="show-credentials" className="text-sm cursor-pointer">
              Show credentials
            </Label>
          </div>
        </div>
      )}

      {platform === 'custom_api' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Custom API Integration</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              After setup, you'll receive a webhook URL and secret to integrate with your platform.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Your API Endpoint (Optional)</Label>
            <Input
              placeholder="https://your-api.com/webhook"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional: We can send notifications to your endpoint
            </p>
          </div>
        </div>
      )}

      {/* Event Selection - Only for WooCommerce and Custom API */}
      {platform !== 'shopify' && (
        <div className="space-y-3">
          <Label>Events to Track</Label>
          <div className="grid gap-2">
            {(Object.keys(EVENT_TYPE_INFO) as OrderEventType[]).map((event) => (
              <div key={event} className="flex items-center space-x-3">
                <Checkbox
                  id={event}
                  checked={trackedEvents.includes(event)}
                  onCheckedChange={() => toggleEvent(event)}
                />
                <Label htmlFor={event} className="flex-1 cursor-pointer">
                  <span className="font-medium">{EVENT_TYPE_INFO[event].name}</span>
                  <span className="text-xs text-muted-foreground block">
                    {EVENT_TYPE_INFO[event].description}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || isOAuthLoading || !isFormValid()}
        >
          {isLoading || isOAuthLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {platform === 'shopify' ? 'Redirecting...' : 'Connecting...'}
            </>
          ) : (
            platform === 'shopify' ? 'Connect with Shopify' : 'Connect'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

// Integration Settings Dialog
function IntegrationSettingsDialog({
  integration,
  open,
  onOpenChange,
  onUpdate,
  onRegenerateSecret,
  isUpdating
}: {
  integration: StoreIntegration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (params: { id: string; tracked_events?: OrderEventType[]; auto_verify_conversions?: boolean }) => Promise<any>;
  onRegenerateSecret: (id: string) => Promise<any>;
  isUpdating: boolean;
}) {
  const [trackedEvents, setTrackedEvents] = useState<OrderEventType[]>(integration.tracked_events);
  const [autoVerify, setAutoVerify] = useState(integration.auto_verify_conversions);
  const [copied, setCopied] = useState(false);
  const { events } = useIntegrationEvents(integration.id);

  const webhookUrl = getWebhookUrl(integration.id, integration.platform);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleEvent = (event: OrderEventType) => {
    setTrackedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleSave = async () => {
    await onUpdate({
      id: integration.id,
      tracked_events: trackedEvents,
      auto_verify_conversions: autoVerify
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {PLATFORM_ICONS[integration.platform]}
            {PLATFORM_INFO[integration.platform].name} Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="events">Events Log</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 mt-4">
            {/* Auto Verify Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Auto-verify Conversions</p>
                <p className="text-sm text-muted-foreground">
                  Automatically verify and approve conversions when orders are confirmed
                </p>
              </div>
              <Switch checked={autoVerify} onCheckedChange={setAutoVerify} />
            </div>

            {/* Event Selection */}
            <div className="space-y-3">
              <Label>Tracked Events</Label>
              <div className="grid gap-2">
                {(Object.keys(EVENT_TYPE_INFO) as OrderEventType[]).map((event) => (
                  <div key={event} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id={`settings-${event}`}
                      checked={trackedEvents.includes(event)}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    <Label htmlFor={`settings-${event}`} className="flex-1 cursor-pointer">
                      <span className="font-medium">{EVENT_TYPE_INFO[event].name}</span>
                      <span className="text-xs text-muted-foreground block">
                        {EVENT_TYPE_INFO[event].description}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={isUpdating} className="w-full">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-6 mt-4">
            {/* Webhook URL */}
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send order events to this URL from your platform
              </p>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <div className="flex gap-2">
                <Input 
                  value={integration.webhook_secret || ''} 
                  readOnly 
                  type="password"
                  className="font-mono text-sm" 
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(integration.webhook_secret || '')}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => onRegenerateSecret(integration.id)}
                  title="Regenerate Secret"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this secret to verify webhook requests from your platform
              </p>
            </div>

            {/* API Documentation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Webhook Payload Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`POST ${webhookUrl}
Content-Type: application/json
X-Webhook-Secret: <your-webhook-secret>

{
  "event": "order_paid",
  "order_id": "ORD-12345",
  "order_total": 1999.00,
  "currency": "INR",
  "customer_email": "customer@example.com",
  "tracking_id": "trk_abc123xyz"
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {events && events.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{event.external_order_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {EVENT_TYPE_INFO[event.event_type].name} • {event.order_total && `₹${event.order_total}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={event.conversion_created ? "default" : "outline"} className="text-xs">
                        {event.conversion_created ? 'Converted' : event.processed ? 'Processed' : 'Pending'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events recorded yet</p>
                <p className="text-xs">Events will appear here once orders start coming in</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
