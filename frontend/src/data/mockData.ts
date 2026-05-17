// Mock data for the ADSSIMSIM platform

export interface Brand {
  id: string;
  name: string;
  logo: string;
  category: string;
  description: string;
  cashbackPercent: number;
  isPremium: boolean;
  isVerified: boolean;
  totalOffers: number;
}

export interface Offer {
  id: string;
  brandId: string;
  brandName: string;
  brandLogo: string;
  title: string;
  description: string;
  cashbackPercent: number;
  validUntil: string;
  isPremium: boolean;
  category: string;
  code?: string;
}

export interface CashbackTransaction {
  id: string;
  brandName: string;
  brandLogo: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  date: string;
  offerId: string;
}

export interface WalletBalance {
  pending: number;
  approved: number;
  totalWithdrawn: number;
}

export const categories = [
  { id: 'accounting', name: 'Accounting & Tax', icon: '🧮', count: 0 },
  { id: 'advertising', name: 'Advertising & Marketing', icon: '📢', count: 0 },
  { id: 'aerospace', name: 'Aerospace & Defense', icon: '🚀', count: 0 },
  { id: 'agriculture', name: 'Agriculture & Farming', icon: '🌾', count: 0 },
  { id: 'airlines', name: 'Airlines & Aviation', icon: '✈️', count: 0 },
  { id: 'apparel', name: 'Apparel & Clothing', icon: '👔', count: 0 },
  { id: 'appliances', name: 'Appliances', icon: '🔌', count: 0 },
  { id: 'architecture', name: 'Architecture & Design', icon: '🏛️', count: 0 },
  { id: 'art', name: 'Art & Collectibles', icon: '🎨', count: 0 },
  { id: 'automotive', name: 'Automotive', icon: '🚗', count: 0 },
  { id: 'baby', name: 'Baby & Kids', icon: '👶', count: 0 },
  { id: 'bakery', name: 'Bakery & Confectionery', icon: '🧁', count: 0 },
  { id: 'banking', name: 'Banking & Finance', icon: '🏦', count: 0 },
  { id: 'beauty', name: 'Beauty & Cosmetics', icon: '💄', count: 0 },
  { id: 'beverages', name: 'Beverages & Drinks', icon: '🍹', count: 0 },
  { id: 'biotech', name: 'Biotechnology', icon: '🧬', count: 0 },
  { id: 'books', name: 'Books & Publishing', icon: '📚', count: 0 },
  { id: 'brewing', name: 'Brewing & Distilling', icon: '🍺', count: 0 },
  { id: 'broadcasting', name: 'Broadcasting & Media', icon: '📺', count: 0 },
  { id: 'building', name: 'Building Materials', icon: '🧱', count: 0 },
  { id: 'cannabis', name: 'Cannabis & CBD', icon: '🌿', count: 0 },
  { id: 'catering', name: 'Catering & Events', icon: '🍽️', count: 0 },
  { id: 'charity', name: 'Charity & Non-Profit', icon: '💝', count: 0 },
  { id: 'chemicals', name: 'Chemicals & Materials', icon: '⚗️', count: 0 },
  { id: 'cleaning', name: 'Cleaning Services', icon: '🧹', count: 0 },
  { id: 'clothing', name: 'Clothing & Fashion', icon: '👗', count: 0 },
  { id: 'cloud', name: 'Cloud Computing', icon: '☁️', count: 0 },
  { id: 'coffee', name: 'Coffee & Tea', icon: '☕', count: 0 },
  { id: 'construction', name: 'Construction', icon: '🏗️', count: 0 },
  { id: 'consulting', name: 'Consulting', icon: '💼', count: 0 },
  { id: 'cosmetics', name: 'Cosmetics & Skincare', icon: '🧴', count: 0 },
  { id: 'crafts', name: 'Crafts & Hobbies', icon: '🎭', count: 0 },
  { id: 'crypto', name: 'Cryptocurrency & Blockchain', icon: '₿', count: 0 },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔐', count: 0 },
  { id: 'dairy', name: 'Dairy Products', icon: '🥛', count: 0 },
  { id: 'dating', name: 'Dating & Relationships', icon: '💕', count: 0 },
  { id: 'dental', name: 'Dental Care', icon: '🦷', count: 0 },
  { id: 'ecommerce', name: 'E-Commerce', icon: '🛍️', count: 0 },
  { id: 'education', name: 'Education & Training', icon: '🎓', count: 0 },
  { id: 'electronics', name: 'Electronics', icon: '📱', count: 0 },
  { id: 'energy', name: 'Energy & Utilities', icon: '⚡', count: 0 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', count: 0 },
  { id: 'environmental', name: 'Environmental Services', icon: '♻️', count: 0 },
  { id: 'eyewear', name: 'Eyewear & Optical', icon: '👓', count: 0 },
  { id: 'fitness', name: 'Fitness & Gym', icon: '🏋️', count: 0 },
  { id: 'florist', name: 'Florist & Gifts', icon: '💐', count: 0 },
  { id: 'food', name: 'Food & Dining', icon: '🍔', count: 0 },
  { id: 'footwear', name: 'Footwear & Shoes', icon: '👟', count: 0 },
  { id: 'furniture', name: 'Furniture', icon: '🛋️', count: 0 },
  { id: 'gaming', name: 'Gaming & Esports', icon: '🎮', count: 0 },
  { id: 'gardening', name: 'Gardening & Landscaping', icon: '🌻', count: 0 },
  { id: 'government', name: 'Government & Public Sector', icon: '🏛️', count: 0 },
  { id: 'grocery', name: 'Grocery & Supermarket', icon: '🛒', count: 0 },
  { id: 'hardware', name: 'Hardware & Tools', icon: '🔨', count: 0 },
  { id: 'healthcare', name: 'Healthcare & Medical', icon: '🏥', count: 0 },
  { id: 'home', name: 'Home & Living', icon: '🏠', count: 0 },
  { id: 'hospitality', name: 'Hospitality & Hotels', icon: '🏨', count: 0 },
  { id: 'hr', name: 'Human Resources', icon: '👥', count: 0 },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', count: 0 },
  { id: 'interior', name: 'Interior Design', icon: '🎨', count: 0 },
  { id: 'internet', name: 'Internet Services', icon: '🌐', count: 0 },
  { id: 'investment', name: 'Investment & Trading', icon: '📈', count: 0 },
  { id: 'jewelry', name: 'Jewelry & Watches', icon: '💎', count: 0 },
  { id: 'legal', name: 'Legal Services', icon: '⚖️', count: 0 },
  { id: 'logistics', name: 'Logistics & Shipping', icon: '📦', count: 0 },
  { id: 'luxury', name: 'Luxury Goods', icon: '👑', count: 0 },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭', count: 0 },
  { id: 'marine', name: 'Marine & Boating', icon: '🚤', count: 0 },
  { id: 'massage', name: 'Massage & Spa', icon: '💆', count: 0 },
  { id: 'meat', name: 'Meat & Seafood', icon: '🥩', count: 0 },
  { id: 'medical', name: 'Medical Devices', icon: '🩺', count: 0 },
  { id: 'mining', name: 'Mining & Metals', icon: '⛏️', count: 0 },
  { id: 'mobile', name: 'Mobile Apps', icon: '📲', count: 0 },
  { id: 'music', name: 'Music & Audio', icon: '🎵', count: 0 },
  { id: 'networking', name: 'Networking & Telecom', icon: '📡', count: 0 },
  { id: 'nutrition', name: 'Nutrition & Supplements', icon: '💊', count: 0 },
  { id: 'organic', name: 'Organic & Natural', icon: '🌱', count: 0 },
  { id: 'outdoor', name: 'Outdoor & Recreation', icon: '🏕️', count: 0 },
  { id: 'packaging', name: 'Packaging', icon: '📦', count: 0 },
  { id: 'payments', name: 'Payments & Fintech', icon: '💳', count: 0 },
  { id: 'perfume', name: 'Perfume & Fragrance', icon: '🌸', count: 0 },
  { id: 'pets', name: 'Pets & Animals', icon: '🐾', count: 0 },
  { id: 'pharma', name: 'Pharmaceuticals', icon: '💉', count: 0 },
  { id: 'photography', name: 'Photography', icon: '📷', count: 0 },
  { id: 'printing', name: 'Printing & Signage', icon: '🖨️', count: 0 },
  { id: 'realestate', name: 'Real Estate', icon: '🏢', count: 0 },
  { id: 'recycling', name: 'Recycling & Waste', icon: '♻️', count: 0 },
  { id: 'rental', name: 'Rental Services', icon: '🔑', count: 0 },
  { id: 'restaurant', name: 'Restaurant & Cafe', icon: '🍽️', count: 0 },
  { id: 'retail', name: 'Retail', icon: '🏪', count: 0 },
  { id: 'saas', name: 'SaaS & Software', icon: '💻', count: 0 },
  { id: 'salon', name: 'Salon & Hair Care', icon: '💇', count: 0 },
  { id: 'security', name: 'Security Services', icon: '🔒', count: 0 },
  { id: 'semiconductor', name: 'Semiconductor', icon: '🔬', count: 0 },
  { id: 'sports', name: 'Sports & Athletics', icon: '⚽', count: 0 },
  { id: 'stationery', name: 'Stationery & Office', icon: '📝', count: 0 },
  { id: 'storage', name: 'Storage & Warehousing', icon: '🗄️', count: 0 },
  { id: 'streaming', name: 'Streaming & OTT', icon: '🎥', count: 0 },
  { id: 'textiles', name: 'Textiles & Fabrics', icon: '🧵', count: 0 },
  { id: 'tourism', name: 'Tourism & Travel', icon: '🗺️', count: 0 },
  { id: 'toys', name: 'Toys & Games', icon: '🧸', count: 0 },
  { id: 'transportation', name: 'Transportation', icon: '🚌', count: 0 },
  { id: 'veterinary', name: 'Veterinary Services', icon: '🐕', count: 0 },
  { id: 'wedding', name: 'Wedding & Bridal', icon: '💒', count: 0 },
  { id: 'wellness', name: 'Wellness & Self-Care', icon: '🧘', count: 0 },
  { id: 'wine', name: 'Wine & Spirits', icon: '🍷', count: 0 },
];

export const brands: Brand[] = [];

export const offers: Offer[] = [];

export const cashbackTransactions: CashbackTransaction[] = [];

export const walletBalance: WalletBalance = {
  pending: 0,
  approved: 0,
  totalWithdrawn: 0,
};
