import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  ArrowRight, 
  Video, 
  Film, 
  Image, 
  Calendar,
  IndianRupee,
  Tag,
  FileText,
  Check,
  Upload,
  Loader2,
  Link,
  Copy,
  CheckCircle,
  ExternalLink,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { categories } from "@/data/mockData";
import { useCampaignMutations, Campaign } from "@/hooks/useCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { getWebhookCallbackUrl } from "@/lib/campaignValidation";

type AdFormat = 'landscape' | 'reel' | 'display';

interface CampaignFormData {
  adFormat: AdFormat | null;
  title: string;
  description: string;
  cashAllotment: number;
  category: string;
  code: string;
  destinationUrl: string;
  rewardHoldDays: number;
  startDate: string;
  endDate: string;
  imageUrl: string;
  videoUrl: string;
}

interface CampaignCreationFormProps {
  onComplete: () => void;
  onCancel: () => void;
  campaign?: Campaign; // For edit mode
}

const adFormatOptions = [
  {
    id: 'landscape' as AdFormat,
    icon: Video,
    title: 'Landscape Video Ad',
    description: 'Best for standard video platforms (16:9 ratio).',
  },
  {
    id: 'reel' as AdFormat,
    icon: Film,
    title: 'Reel Video Ad',
    description: 'Optimized for vertical formats like stories and reels (9:16 ratio).',
  },
  {
    id: 'display' as AdFormat,
    icon: Image,
    title: 'Display Ad',
    description: 'A static image ad for broad reach.',
  },
];

export function CampaignCreationForm({ onComplete, onCancel, campaign }: CampaignCreationFormProps) {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { createCampaign, updateCampaign, isCreating, isUpdating } = useCampaignMutations();
  
  const isEditMode = !!campaign;
  const [step, setStep] = useState(isEditMode ? 2 : 1); // Skip ad format selection in edit mode
  
  // Success modal state for new campaign creation
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(() => {
    if (campaign) {
      return {
        adFormat: campaign.ad_format as AdFormat || null,
        title: campaign.title,
        description: campaign.description || '',
        cashAllotment: campaign.cash_allotment,
        category: campaign.category || '',
        code: campaign.code || '',
        destinationUrl: campaign.destination_url || '',
        rewardHoldDays: campaign.reward_hold_days ?? 7,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        imageUrl: campaign.image_url || '',
        videoUrl: campaign.video_url || '',
      };
    }
    return {
      adFormat: null,
      title: '',
      description: '',
      cashAllotment: 100,
      category: '',
      code: '',
      destinationUrl: '',
      rewardHoldDays: 7,
      startDate: '',
      endDate: '',
      imageUrl: '',
      videoUrl: '',
    };
  });

  // Generate webhook URL for existing campaigns
  const webhookCallbackUrl = isEditMode && campaign ? getWebhookCallbackUrl(campaign.id) : null;

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [urlError, setUrlError] = useState('');

  const validateUrl = (value: string) => {
    if (!value.trim()) {
      setUrlError('');
      return;
    }
    try {
      new URL(value.trim());
      setUrlError('');
    } catch {
      setUrlError('Please enter a valid URL (e.g., https://your-site.com/promo)');
    }
  };

  const uploadToStorage = useCallback(async (file: File, fieldName: 'imageUrl' | 'videoUrl') => {
    if (!company) {
      toast.error("Please log in first");
      return;
    }

    const isVideo = fieldName === 'videoUrl';
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${isVideo ? '100MB' : '5MB'}.`);
      return;
    }

    const setter = isVideo ? setIsUploadingVideo : setIsUploadingImage;
    setter(true);

    try {
      const filePath = `${company.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('campaign-media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [fieldName]: publicUrl }));
      toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setter(false);
    }
  }, [company]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToStorage(file, 'imageUrl');
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToStorage(file, 'videoUrl');
  };

  const totalSteps = 4;

  const handleFormatSelect = (format: AdFormat) => {
    setFormData(prev => ({ ...prev, adFormat: format }));
    setStep(2);
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'destinationUrl' && typeof value === 'string') {
      validateUrl(value);
    }
  };

  const copyWebhookUrl = (url?: string) => {
    const urlToCopy = url || webhookCallbackUrl;
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      toast.success("Webhook URL copied to clipboard");
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCreatedCampaign(null);
    onComplete();
  };

  const handleViewCampaign = () => {
    if (createdCampaign) {
      setShowSuccessModal(false);
      navigate(`/brand/campaign/${createdCampaign.id}/performance`);
    }
  };

  const handleSubmit = async () => {
    if (!company) {
      toast.error("Please log in to create a campaign");
      return;
    }

    if (!formData.adFormat || !formData.title || !formData.description || 
        !formData.category || !formData.startDate || !formData.endDate || !formData.destinationUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (isEditMode && campaign) {
        // Update existing campaign
        await updateCampaign({
          id: campaign.id,
          updates: {
            title: formData.title,
            description: formData.description,
            cash_allotment: formData.cashAllotment,
            category: formData.category,
            ad_format: formData.adFormat,
            image_url: formData.imageUrl || undefined,
            video_url: formData.videoUrl || undefined,
            start_date: formData.startDate,
            end_date: formData.endDate,
            code: formData.code || undefined,
            destination_url: formData.destinationUrl.trim(),
            reward_hold_days: formData.rewardHoldDays,
            status: campaign.status,
          },
        });
        toast.success("Campaign updated successfully!");
      } else {
        // Create new campaign and capture the result
        const newCampaign = await createCampaign({
          title: formData.title,
          description: formData.description,
          cash_allotment: formData.cashAllotment,
          category: formData.category,
          ad_format: formData.adFormat,
          image_url: formData.imageUrl || undefined,
          video_url: formData.videoUrl || undefined,
          start_date: formData.startDate,
          end_date: formData.endDate,
          code: formData.code || undefined,
          destination_url: formData.destinationUrl.trim(),
          reward_hold_days: formData.rewardHoldDays,
          status: 'active',
        });
        
        // Show success modal with webhook URL instead of immediate navigation
        setCreatedCampaign(newCampaign);
        setShowSuccessModal(true);
        // Note: onComplete() is NOT called here - it's called when modal is dismissed
        return;
      }
      onComplete();
    } catch (error) {
      console.error('Campaign error:', error);
      toast.error(isEditMode ? "Failed to update campaign" : "Failed to create campaign");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.adFormat !== null;
      case 2: {
        const hasBasicFields = formData.title && formData.description && formData.cashAllotment > 0 && formData.category;
        const hasDestinationUrl = !!formData.destinationUrl && !urlError;
        const hasImage = !!formData.imageUrl;
        const hasVideo = formData.adFormat === 'display' || !!formData.videoUrl;
        return hasBasicFields && hasDestinationUrl && hasImage && hasVideo;
      }
      case 3:
        return formData.startDate && formData.endDate && new Date(formData.endDate) >= new Date(formData.startDate);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Choose Your Ad Format</h2>
            <p className="text-muted-foreground mb-8">Select the type of ad you would like to create for your deal.</p>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {adFormatOptions.map((option) => (
                <Card 
                  key={option.id}
                  variant="default" 
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    formData.adFormat === option.id ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => handleFormatSelect(option.id)}
                >
                  <CardContent className="flex flex-col items-center justify-center py-10 px-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                      <option.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-2">{option.title}</h3>
                    <p className="text-center text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    {formData.adFormat === option.id && (
                      <Badge variant="success" className="mt-3">
                        <Check className="mr-1 h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Campaign Details</h2>
            <p className="text-muted-foreground mb-8">Fill in the details for your campaign.</p>
            
            <Card variant="default">
              <CardContent className="p-6 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Flat 20% Cashback on All Products"
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your offer and any terms & conditions"
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                {/* Cash Allotment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Cash Allotment (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cashAllotment}
                    onChange={(e) => handleInputChange('cashAllotment', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 200"
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <SearchableSelect
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    options={categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                      icon: cat.icon,
                    }))}
                    placeholder="Select a category"
                    searchPlaceholder="Search categories..."
                    emptyMessage="No category found."
                  />
                </div>

                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Promo Code (Optional)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20"
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  />
                </div>

                {/* Destination URL - REQUIRED */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    value={formData.destinationUrl}
                    onChange={(e) => handleInputChange('destinationUrl', e.target.value)}
                    onBlur={(e) => validateUrl(e.target.value)}
                    placeholder="e.g., https://your-brand.com/promo-page"
                    className={`w-full rounded-md border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-1 ${
                      urlError ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'
                    }`}
                    required
                  />
                  {urlError && (
                    <p className="text-xs text-destructive">{urlError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Users will be redirected here with a tracking parameter (?ref=trk_xxx) when they click "Grab Deal".
                  </p>
                </div>

                {/* Reward Hold Period */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Reward Hold Period (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.rewardHoldDays}
                    onChange={(e) => handleInputChange('rewardHoldDays', parseInt(e.target.value) || 7)}
                    placeholder="e.g., 7"
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days to wait after purchase before releasing the cashback reward. Set this to match your return/refund policy period.
                  </p>
                </div>

                {/* Webhook Callback URL - Only shown for existing campaigns */}
                {isEditMode && webhookCallbackUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Webhook Callback URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookCallbackUrl}
                        readOnly
                        className="flex-1 rounded-md border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyWebhookUrl()}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Alert className="bg-muted/50">
                      <AlertDescription className="text-xs">
                        Share this URL with your tracking partner. They should send conversion postbacks here with the <code className="bg-background px-1 py-0.5 rounded text-primary">tracking_id</code> or <code className="bg-background px-1 py-0.5 rounded text-primary">ref</code> parameter.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Video Upload - Only for video ad formats */}
                {(formData.adFormat === 'landscape' || formData.adFormat === 'reel') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Ad Video *
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className="cursor-pointer block">
                        {isUploadingVideo ? (
                          <div className="flex flex-col items-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Uploading video...</p>
                          </div>
                        ) : formData.videoUrl ? (
                          <video src={formData.videoUrl} className="max-h-40 mx-auto rounded" controls />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload video</p>
                            <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV (max 100MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Thumbnail Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    {formData.adFormat === 'display' ? 'Display Ad Image *' : 'Thumbnail Image *'}
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center py-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Uploading image...</p>
                        </div>
                      ) : formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Thumbnail" className="max-h-40 mx-auto rounded" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload image</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WebP (max 5MB) {formData.adFormat === 'display' ? '(recommended: 1200x628)' : '(recommended: 1280x720)'}
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Campaign Duration</h2>
            <p className="text-muted-foreground mb-8">Set the start and end dates for your campaign.</p>
            
            <Card variant="default">
              <CardContent className="p-6 space-y-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="rounded-lg bg-primary/10 p-4">
                    <p className="text-sm text-primary">
                      Campaign will run for{' '}
                      <span className="font-semibold">
                        {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Review & Launch</h2>
            <p className="text-muted-foreground mb-8">Review your campaign details before publishing.</p>
            
            <Card variant="default">
              <CardContent className="p-6 space-y-6">
                {/* Preview */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {formData.imageUrl && (
                      <img src={formData.imageUrl} alt="Campaign" className="h-24 w-24 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-display text-xl font-bold">{formData.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{formData.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="cashback">₹{formData.cashAllotment} Cash Allotment</Badge>
                        <Badge variant="outline">{formData.category}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{new Date(formData.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{new Date(formData.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Destination URL</p>
                    <p className="font-medium text-sm break-all">{formData.destinationUrl}</p>
                  </div>

                  {formData.code && (
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">Promo Code</p>
                      <p className="font-mono font-bold text-lg">{formData.code}</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Reward Hold Period</p>
                    <p className="font-medium">{formData.rewardHoldDays} days</p>
                  </div>

                  {!isEditMode && (
                    <Alert className="bg-primary/5 border-primary/20">
                      <AlertDescription className="text-xs">
                        After creating the campaign, you'll receive a webhook callback URL that you can share with your tracking partner for automatic conversion tracking.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex h-10 w-10 items-center justify-center rounded-full font-medium ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="h-5 w-5" /> : s}
            </div>
          ))}
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute h-full bg-primary"
            initial={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 1 || (isEditMode && step === 2)) {
              onCancel();
            } else {
              setStep(step - 1);
            }
          }}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === 1 || (isEditMode && step === 2) ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex gap-2">
          {step === 4 ? (
            <>
              <Button
                onClick={() => handleSubmit()}
                disabled={!canProceed() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Save Changes' : 'Launch Campaign'}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || isLoading}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Success Modal with Webhook URL */}
      <Dialog open={showSuccessModal} onOpenChange={handleSuccessModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <DialogTitle className="text-center">
              Campaign Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your campaign "{createdCampaign?.title}" is now live and ready to track conversions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <Label className="text-sm font-medium">Webhook Callback URL</Label>
            <div className="flex gap-2">
              <Input
                value={createdCampaign ? getWebhookCallbackUrl(createdCampaign.id) : ''}
                readOnly
                className="font-mono text-xs"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => createdCampaign && copyWebhookUrl(getWebhookCallbackUrl(createdCampaign.id))}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this URL with your tracking partner to receive conversion notifications automatically.
            </p>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleViewCampaign} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View Campaign
            </Button>
            <Button onClick={handleSuccessModalClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
