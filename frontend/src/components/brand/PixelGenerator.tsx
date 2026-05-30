import { useState } from 'react';
import { Copy, Check, Code, FileCode, Terminal, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PixelGeneratorProps {
  companyId: string;
  campaignId?: string;
  webhookSecret?: string;
}

export function PixelGenerator({ companyId, campaignId, webhookSecret }: PixelGeneratorProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [orderIdSelector, setOrderIdSelector] = useState('#order-id');
  const [orderTotalSelector, setOrderTotalSelector] = useState('#order-total');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl = `${supabaseUrl}/functions/v1/conversion-webhook`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  // Basic JavaScript Pixel
  const basicPixel = `<!-- ADSSIMSIM Conversion Tracking Pixel -->
<script>
(function() {
  var WEBHOOK_URL = '${webhookUrl}';
  var COMPANY_ID = '${companyId}';
  ${campaignId ? `var CAMPAIGN_ID = '${campaignId}';` : ''}
  
  // Get tracking ID from URL or storage
  function getTrackingId() {
    var urlParams = new URLSearchParams(window.location.search);
    var trackingId = urlParams.get('ref') || urlParams.get('tracking_id');
    
    // Check localStorage as fallback
    if (!trackingId) {
      try {
        var stored = localStorage.getItem('adssimsim_tracking');
        if (stored) {
          var data = JSON.parse(stored);
          if (new Date(data.expiresAt) > new Date()) {
            trackingId = data.trackingId;
          }
        }
      } catch(e) {}
    }
    
    // Check cookie as final fallback
    if (!trackingId) {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim().split('=');
        if (cookie[0] === 'adssimsim_ref') {
          trackingId = cookie[1];
          break;
        }
      }
    }
    
    return trackingId;
  }
  
  // Store tracking ID for persistence
  function storeTracking(trackingId) {
    if (!trackingId) return;
    
    var expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    var data = {
      trackingId: trackingId,
      expiresAt: expires.toISOString()
    };
    
    try {
      localStorage.setItem('adssimsim_tracking', JSON.stringify(data));
      document.cookie = 'adssimsim_ref=' + trackingId + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
    } catch(e) {}
  }
  
  // Track conversion
  window.adssimsimTrack = function(orderId, orderTotal, currency) {
    var trackingId = getTrackingId();
    if (!trackingId) {
      console.warn('[ADSSIMSIM] No tracking ID found');
      return;
    }
    
    var payload = {
      tracking_id: trackingId,
      order_id: orderId || 'unknown',
      order_total: parseFloat(orderTotal) || 0,
      currency: currency || 'INR',
      company_id: COMPANY_ID,
      source: 'pixel'
    };
    
    // Send via Beacon API (most reliable)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WEBHOOK_URL, JSON.stringify(payload));
    } else {
      // Fallback to fetch
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    }
    
    // Clear tracking to prevent duplicates
    localStorage.removeItem('adssimsim_tracking');
    document.cookie = 'adssimsim_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('[ADSSIMSIM] Conversion tracked:', payload);
  };
  
  // Auto-store tracking on page load
  var trackingId = new URLSearchParams(window.location.search).get('ref');
  if (trackingId) {
    storeTracking(trackingId);
  }
})();
</script>`;

  // Auto-detect Pixel (tries to find order data automatically)
  const autoDetectPixel = `<!-- ADSSIMSIM Auto-Detect Conversion Pixel -->
<script>
(function() {
  var WEBHOOK_URL = '${webhookUrl}';
  var COMPANY_ID = '${companyId}';
  
  function getTrackingId() {
    var urlParams = new URLSearchParams(window.location.search);
    var trackingId = urlParams.get('ref') || urlParams.get('tracking_id');
    if (!trackingId) {
      try {
        var stored = localStorage.getItem('adssimsim_tracking');
        if (stored) {
          var data = JSON.parse(stored);
          if (new Date(data.expiresAt) > new Date()) {
            trackingId = data.trackingId;
          }
        }
      } catch(e) {}
    }
    if (!trackingId) {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim().split('=');
        if (cookie[0] === 'adssimsim_ref') {
          trackingId = cookie[1];
          break;
        }
      }
    }
    return trackingId;
  }
  
  function storeTracking(trackingId) {
    if (!trackingId) return;
    var expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    try {
      localStorage.setItem('adssimsim_tracking', JSON.stringify({
        trackingId: trackingId,
        expiresAt: expires.toISOString()
      }));
      document.cookie = 'adssimsim_ref=' + trackingId + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
    } catch(e) {}
  }
  
  // Auto-detect order data from common selectors
  function detectOrderData() {
    var orderId = null;
    var orderTotal = null;
    
    // Common order ID selectors
    var orderIdSelectors = [
      '${orderIdSelector}',
      '[data-order-id]',
      '.order-number',
      '.order-id',
      '#order-number',
      '.woocommerce-order-overview__order strong',
      '.shopify-order-id'
    ];
    
    for (var i = 0; i < orderIdSelectors.length; i++) {
      var el = document.querySelector(orderIdSelectors[i]);
      if (el) {
        orderId = el.getAttribute('data-order-id') || el.textContent.trim().replace(/[^0-9a-zA-Z-]/g, '');
        if (orderId) break;
      }
    }
    
    // Common order total selectors
    var orderTotalSelectors = [
      '${orderTotalSelector}',
      '[data-order-total]',
      '.order-total',
      '.total-price',
      '.woocommerce-order-overview__total strong',
      '.shopify-order-total'
    ];
    
    for (var j = 0; j < orderTotalSelectors.length; j++) {
      var el = document.querySelector(orderTotalSelectors[j]);
      if (el) {
        var text = el.getAttribute('data-order-total') || el.textContent;
        orderTotal = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (orderTotal) break;
      }
    }
    
    return { orderId: orderId, orderTotal: orderTotal };
  }
  
  // Auto-track on thank-you/confirmation pages
  function autoTrack() {
    var trackingId = getTrackingId();
    if (!trackingId) return;
    
    // Check if this is a thank-you page
    var isThankYouPage = 
      window.location.pathname.includes('thank') ||
      window.location.pathname.includes('confirmation') ||
      window.location.pathname.includes('order-received') ||
      window.location.pathname.includes('checkout/success') ||
      document.querySelector('.order-confirmation, .thank-you, .woocommerce-thankyou');
    
    if (!isThankYouPage) return;
    
    var orderData = detectOrderData();
    
    var payload = {
      tracking_id: trackingId,
      order_id: orderData.orderId || 'auto-' + Date.now(),
      order_total: orderData.orderTotal || 0,
      currency: 'INR',
      company_id: COMPANY_ID,
      source: 'auto-pixel'
    };
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WEBHOOK_URL, JSON.stringify(payload));
    } else {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    }
    
    localStorage.removeItem('adssimsim_tracking');
    document.cookie = 'adssimsim_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('[ADSSIMSIM] Auto-conversion tracked:', payload);
  }
  
  // Store tracking on landing
  var trackingId = new URLSearchParams(window.location.search).get('ref');
  if (trackingId) {
    storeTracking(trackingId);
  }
  
  // Auto-track when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoTrack);
  } else {
    autoTrack();
  }
})();
</script>`;

  // Server-side Postback (for advanced users)
  const serverPostback = `# ADSSIMSIM Server-Side Conversion Tracking
# Use this for server-to-server tracking (most reliable)

# Endpoint
POST ${webhookUrl}

# Headers
Content-Type: application/json
${webhookSecret ? `X-Webhook-Secret: ${webhookSecret}` : '# X-Webhook-Secret: your-webhook-secret'}

# Payload
{
  "tracking_id": "trk_xxxxxxxxxxxxx",  # Required: from ?ref= parameter
  "order_id": "ORDER-12345",           # Required: your order ID
  "order_total": 1999.00,              # Required: order amount
  "currency": "INR",                   # Optional: default INR
  "customer_email": "user@example.com", # Optional: for matching
  "company_id": "${companyId}"         # Optional: your company ID
}

# Example cURL
curl -X POST '${webhookUrl}' \\
  -H 'Content-Type: application/json' \\
  ${webhookSecret ? `-H 'X-Webhook-Secret: ${webhookSecret}' \\` : ''}
  -d '{
    "tracking_id": "trk_abc123",
    "order_id": "ORD-001",
    "order_total": 1999,
    "currency": "INR"
  }'

# Example PHP
<?php
$trackingId = $_GET['ref'] ?? $_COOKIE['adssimsim_ref'] ?? null;

if ($trackingId && $orderCompleted) {
    $payload = json_encode([
        'tracking_id' => $trackingId,
        'order_id' => $orderId,
        'order_total' => $orderTotal,
        'currency' => 'INR'
    ]);
    
    $ch = curl_init('${webhookUrl}');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        ${webhookSecret ? `'X-Webhook-Secret: ${webhookSecret}'` : ''}
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}
?>

# Example Node.js
const trackingId = req.query.ref || req.cookies.adssimsim_ref;

if (trackingId && orderCompleted) {
  await fetch('${webhookUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ${webhookSecret ? `'X-Webhook-Secret': '${webhookSecret}'` : ''}
    },
    body: JSON.stringify({
      tracking_id: trackingId,
      order_id: orderId,
      order_total: orderTotal,
      currency: 'INR'
    })
  });
}`;

  // Landing page tracking snippet
  const landingPageSnippet = `<!-- ADSSIMSIM Landing Page Tracking -->
<!-- Add this to ALL pages on your website (header or before </body>) -->
<script>
(function() {
  // Store tracking ID from URL for 30-day persistence
  var urlParams = new URLSearchParams(window.location.search);
  var trackingId = urlParams.get('ref') || urlParams.get('tracking_id');
  
  if (trackingId) {
    var expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Store in localStorage
    try {
      localStorage.setItem('adssimsim_tracking', JSON.stringify({
        trackingId: trackingId,
        landingPage: window.location.href,
        timestamp: new Date().toISOString(),
        expiresAt: expires.toISOString()
      }));
    } catch(e) {}
    
    // Store in cookie as backup
    document.cookie = 'adssimsim_ref=' + trackingId + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
    
    console.log('[ADSSIMSIM] Tracking stored:', trackingId);
  }
})();
</script>`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Conversion Tracking Pixel Generator</h3>
        <p className="text-sm text-muted-foreground">
          Generate tracking code for brands that don't support webhooks. These pixels provide 60-80% tracking reliability.
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="landing" className="text-xs">Landing Page</TabsTrigger>
          <TabsTrigger value="basic" className="text-xs">Basic Pixel</TabsTrigger>
          <TabsTrigger value="auto" className="text-xs">Auto-Detect</TabsTrigger>
          <TabsTrigger value="server" className="text-xs">Server-Side</TabsTrigger>
        </TabsList>

        <TabsContent value="landing" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Landing Page Tracking
                  </CardTitle>
                  <CardDescription>
                    Add to ALL pages - stores tracking ID for 30 days
                  </CardDescription>
                </div>
                <Badge variant="secondary">Required</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                <strong>Step 1:</strong> Add this snippet to your website header or before {'</body>'} on ALL pages.
                This ensures tracking IDs are stored when users land on your site.
              </div>
              <div className="relative">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-64">
                  {landingPageSnippet}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(landingPageSnippet, 'landing')}
                >
                  {copied === 'landing' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Basic Conversion Pixel
                  </CardTitle>
                  <CardDescription>
                    Manual tracking - call adssimsimTrack() on conversion
                  </CardDescription>
                </div>
                <Badge>Recommended</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <strong>Step 2:</strong> Add to your thank-you/confirmation page. Call <code>adssimsimTrack(orderId, orderTotal)</code> when order is confirmed.
              </div>
              <div className="relative">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-80">
                  {basicPixel}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(basicPixel, 'basic')}
                >
                  {copied === 'basic' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Usage Example:</p>
                <pre className="text-xs">
{`// Call this when order is confirmed
adssimsimTrack('ORDER-123', 1999.00, 'INR');`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Auto-Detect Pixel
                  </CardTitle>
                  <CardDescription>
                    Automatically detects order data on thank-you pages
                  </CardDescription>
                </div>
                <Badge variant="outline">Easy Setup</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order ID Selector</Label>
                  <Input
                    value={orderIdSelector}
                    onChange={(e) => setOrderIdSelector(e.target.value)}
                    placeholder="#order-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order Total Selector</Label>
                  <Input
                    value={orderTotalSelector}
                    onChange={(e) => setOrderTotalSelector(e.target.value)}
                    placeholder="#order-total"
                  />
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm text-green-800 dark:text-green-300">
                This pixel auto-detects thank-you pages and extracts order data. Customize selectors if needed.
              </div>
              <div className="relative">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-80">
                  {autoDetectPixel}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(autoDetectPixel, 'auto')}
                >
                  {copied === 'auto' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="server" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Server-Side Postback
                  </CardTitle>
                  <CardDescription>
                    Most reliable - server-to-server tracking
                  </CardDescription>
                </div>
                <Badge variant="secondary">Advanced</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-sm text-purple-800 dark:text-purple-300">
                <strong>Best reliability (95%+):</strong> Call our API from your server when an order is confirmed. Not affected by ad blockers.
              </div>
              <div className="relative">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-96">
                  {serverPostback}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(serverPostback, 'server')}
                >
                  {copied === 'server' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reliability info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-green-600">95%</div>
              <div className="text-muted-foreground">Server-Side</div>
            </div>
            <div>
              <div className="font-semibold text-blue-600">80%</div>
              <div className="text-muted-foreground">Basic Pixel</div>
            </div>
            <div>
              <div className="font-semibold text-amber-600">70%</div>
              <div className="text-muted-foreground">Auto-Detect</div>
            </div>
            <div>
              <div className="font-semibold text-purple-600">60%</div>
              <div className="text-muted-foreground">Landing Only</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
