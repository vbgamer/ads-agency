export type KnowledgeCategory = 'cashback' | 'account' | 'payments' | 'technical' | 'general';

export interface KnowledgeArticle {
  id: string;
  category: KnowledgeCategory;
  question: string;
  answer: string;
  keywords: string[];
  relatedArticles?: string[];
}

export const CATEGORY_INFO: Record<KnowledgeCategory, { label: string; icon: string; description: string }> = {
  cashback: { label: 'Cashback', icon: '💰', description: 'Missing cashback, delays, amounts' },
  account: { label: 'Account', icon: '👤', description: 'Profile, settings, premium' },
  payments: { label: 'Payments', icon: '💳', description: 'Wallet, withdrawals, methods' },
  technical: { label: 'Technical', icon: '🔧', description: 'App issues, tracking, links' },
  general: { label: 'General', icon: '❓', description: 'How it works, eligibility' },
};

export const knowledgeBase: KnowledgeArticle[] = [
  // Cashback Category
  {
    id: 'cb-1',
    category: 'cashback',
    question: "Why haven't I received my cashback?",
    answer: "Cashback may take 24-72 hours to appear after your purchase is confirmed. If it's been longer, check that: (1) You clicked through our tracking link before purchasing, (2) You didn't use another coupon code not listed on our site, (3) Your order wasn't cancelled or returned. If everything checks out, you can file a missing cashback dispute from the Disputes tab.",
    keywords: ['missing', 'not received', 'no cashback', 'where', 'pending'],
    relatedArticles: ['cb-2', 'cb-5'],
  },
  {
    id: 'cb-2',
    category: 'cashback',
    question: 'How long does cashback take to appear?',
    answer: "Most cashbacks appear within 24-72 hours as 'Pending' in your wallet. They become 'Available' after the brand confirms your purchase, which typically takes 30-90 days depending on the brand's return policy. Premium members enjoy faster processing times.",
    keywords: ['time', 'how long', 'waiting', 'pending', 'appear', 'show'],
    relatedArticles: ['cb-1', 'cb-5'],
  },
  {
    id: 'cb-3',
    category: 'cashback',
    question: 'My cashback amount seems incorrect',
    answer: "Cashback is calculated on the net purchase amount (after discounts, before taxes and shipping). Some product categories may have different rates or exclusions. Check the offer details for specific terms. If you believe there's still an error, file a dispute with your order details.",
    keywords: ['wrong', 'incorrect', 'less', 'amount', 'calculation', 'different'],
    relatedArticles: ['cb-9', 'cb-7'],
  },
  {
    id: 'cb-4',
    category: 'cashback',
    question: 'Cashback was rejected - what can I do?',
    answer: "Cashback can be rejected if: the order was cancelled/returned, a non-approved coupon was used, the purchase was made outside the tracking window, or the brand declined it. You can file a dispute with proof of purchase (order confirmation, payment receipt) and our team will investigate within 5-7 business days.",
    keywords: ['rejected', 'denied', 'declined', 'refused', 'appeal'],
    relatedArticles: ['cb-1', 'cb-8'],
  },
  {
    id: 'cb-5',
    category: 'cashback',
    question: 'Why is my cashback still pending?',
    answer: "Pending cashback means your purchase is tracked but awaiting brand confirmation. This hold period allows for potential returns or cancellations. Standard hold is 30-90 days based on brand policy. Once confirmed, it moves to your available balance automatically.",
    keywords: ['pending', 'waiting', 'hold', 'not available', 'stuck'],
    relatedArticles: ['cb-2', 'cb-1'],
  },
  {
    id: 'cb-6',
    category: 'cashback',
    question: 'How do I track my cashback status?',
    answer: "Go to your Dashboard > Wallet section to see all your cashback transactions. Each entry shows: the brand, amount, status (Pending/Available/Withdrawn), and expected availability date. You can also click on any transaction for more details.",
    keywords: ['track', 'status', 'check', 'view', 'monitor', 'history'],
    relatedArticles: ['cb-2', 'pay-1'],
  },
  {
    id: 'cb-7',
    category: 'cashback',
    question: 'Does cashback work on all products?',
    answer: "Most products are eligible, but some categories may be excluded (gift cards, subscriptions, certain electronics). Each offer page lists specific exclusions. Sale items and clearance usually qualify unless noted otherwise.",
    keywords: ['eligible', 'products', 'excluded', 'categories', 'work', 'apply'],
    relatedArticles: ['cb-3', 'cb-9'],
  },
  {
    id: 'cb-8',
    category: 'cashback',
    question: 'What happens if I return an order?',
    answer: "If you return an order, the associated cashback will be reversed. Partial returns result in adjusted cashback based on the kept items. The reversal typically happens within 7-14 days after the brand processes the return.",
    keywords: ['return', 'refund', 'cancel', 'reversed', 'order cancelled'],
    relatedArticles: ['cb-4', 'cb-5'],
  },
  {
    id: 'cb-9',
    category: 'cashback',
    question: 'Maximum cashback limits explained',
    answer: "Some offers have maximum cashback caps (e.g., 'Up to ₹500'). Once you reach the cap, additional purchases won't earn more cashback for that offer. Check the offer details for any caps before making large purchases.",
    keywords: ['maximum', 'limit', 'cap', 'max cashback', 'ceiling'],
    relatedArticles: ['cb-3', 'cb-7'],
  },
  {
    id: 'cb-10',
    category: 'cashback',
    question: 'How to qualify for cashback',
    answer: "To earn cashback: (1) Click the 'Shop Now' or tracking link on our site, (2) Complete your purchase in the same browser session, (3) Don't use external coupons unless listed on our site, (4) Don't switch between devices mid-purchase. Pro tip: Clear your cookies or use incognito mode for best tracking.",
    keywords: ['qualify', 'earn', 'how to', 'get cashback', 'eligible', 'requirements'],
    relatedArticles: ['cb-1', 'tech-2'],
  },

  // Account Category
  {
    id: 'acc-1',
    category: 'account',
    question: 'How do I update my profile?',
    answer: "Go to your Dashboard and click on the Profile section. Here you can update your name, email, phone number, and location. Changes are saved automatically. Some changes like email may require verification.",
    keywords: ['profile', 'update', 'edit', 'change', 'name', 'details'],
    relatedArticles: ['acc-6'],
  },
  {
    id: 'acc-2',
    category: 'account',
    question: 'I forgot my password',
    answer: "Click 'Forgot Password' on the login page and enter your registered email. You'll receive a password reset link within minutes. Check your spam folder if you don't see it. The link expires in 24 hours for security.",
    keywords: ['forgot', 'password', 'reset', 'cant login', 'lost password'],
    relatedArticles: ['acc-8', 'acc-1'],
  },
  {
    id: 'acc-3',
    category: 'account',
    question: 'How to verify my account',
    answer: "Account verification helps unlock higher withdrawal limits and builds trust. Go to Profile > Verification and complete: email verification (click link sent to email), phone verification (enter OTP), and optionally add a government ID for premium features.",
    keywords: ['verify', 'verification', 'confirm', 'authenticate', 'KYC'],
    relatedArticles: ['acc-4', 'pay-1'],
  },
  {
    id: 'acc-4',
    category: 'account',
    question: 'Premium membership benefits',
    answer: "Premium members enjoy: 2x cashback rates on select offers, faster cashback processing, priority support, exclusive deals and early access to new offers, ad-free browsing, and higher withdrawal limits. The membership pays for itself with regular use!",
    keywords: ['premium', 'benefits', 'membership', 'advantages', 'perks', 'features'],
    relatedArticles: ['acc-5'],
  },
  {
    id: 'acc-5',
    category: 'account',
    question: 'How to upgrade to Premium',
    answer: "Go to your Dashboard > Subscription or click 'Go Premium' in the header. Choose monthly or annual billing (save 20% annually). Payment is processed securely and your premium benefits activate immediately.",
    keywords: ['upgrade', 'premium', 'subscribe', 'join', 'membership'],
    relatedArticles: ['acc-4', 'pay-4'],
  },
  {
    id: 'acc-6',
    category: 'account',
    question: 'Can I change my email address?',
    answer: "Yes! Go to Profile > Account Settings and click 'Change Email'. You'll need to verify the new email address by clicking a confirmation link. Your login credentials will update once verified.",
    keywords: ['change email', 'update email', 'new email', 'email address'],
    relatedArticles: ['acc-1', 'acc-3'],
  },
  {
    id: 'acc-7',
    category: 'account',
    question: 'How to delete my account',
    answer: "We're sorry to see you go! To delete your account, go to Profile > Account Settings > Delete Account. Note: This will permanently delete all your data including pending cashback. Withdrawable balance should be claimed first. Account deletion is irreversible.",
    keywords: ['delete', 'remove', 'close account', 'deactivate', 'cancel'],
    relatedArticles: ['pay-1'],
  },
  {
    id: 'acc-8',
    category: 'account',
    question: "Why can't I log in?",
    answer: "Common login issues: (1) Check caps lock for password, (2) Use the correct email, (3) Try 'Forgot Password' if unsure, (4) Clear browser cache and cookies, (5) Try a different browser. If problems persist, contact support with your registered email.",
    keywords: ['login', 'cant login', 'access', 'sign in', 'locked out'],
    relatedArticles: ['acc-2', 'tech-4'],
  },

  // Payments Category
  {
    id: 'pay-1',
    category: 'payments',
    question: 'How to withdraw cashback',
    answer: "Go to Dashboard > Wallet and click 'Withdraw'. Choose your preferred method (UPI, Bank Transfer), enter the amount (min ₹100), and confirm. UPI withdrawals are typically instant; bank transfers take 2-3 business days.",
    keywords: ['withdraw', 'cash out', 'get money', 'redeem', 'transfer'],
    relatedArticles: ['pay-2', 'pay-3'],
  },
  {
    id: 'pay-2',
    category: 'payments',
    question: 'Minimum withdrawal amount',
    answer: "The minimum withdrawal is ₹100 for both UPI and bank transfers. Premium members can withdraw any amount with no minimum. There's no maximum limit for verified accounts.",
    keywords: ['minimum', 'withdrawal limit', 'how much', 'threshold'],
    relatedArticles: ['pay-1', 'acc-3'],
  },
  {
    id: 'pay-3',
    category: 'payments',
    question: 'Withdrawal processing time',
    answer: "UPI withdrawals: Instant to 4 hours. Bank transfers: 2-3 business days. Premium members get priority processing. Withdrawals requested after 6 PM may be processed the next business day.",
    keywords: ['time', 'processing', 'how long', 'waiting', 'withdrawal time'],
    relatedArticles: ['pay-1', 'pay-5'],
  },
  {
    id: 'pay-4',
    category: 'payments',
    question: 'Adding payment methods',
    answer: "Go to Dashboard > Payment Methods and click 'Add New'. You can add: UPI ID (verified via ₹1 test), Bank Account (with IFSC), or saved cards for premium subscriptions. All payment details are encrypted and secure.",
    keywords: ['add', 'payment method', 'UPI', 'bank', 'card', 'setup'],
    relatedArticles: ['pay-5', 'pay-1'],
  },
  {
    id: 'pay-5',
    category: 'payments',
    question: 'UPI vs Bank transfer',
    answer: "UPI: Faster (instant to 4 hours), convenient, works 24/7. Bank Transfer: May take 2-3 days but works for any amount. We recommend UPI for quick access to your cashback. Both methods are equally secure.",
    keywords: ['UPI', 'bank', 'difference', 'which', 'compare', 'better'],
    relatedArticles: ['pay-4', 'pay-3'],
  },
  {
    id: 'pay-6',
    category: 'payments',
    question: 'Failed withdrawal - what to do?',
    answer: "If your withdrawal failed: (1) Check if payment details are correct, (2) Ensure sufficient available balance (not pending), (3) Verify your account if not done, (4) Try a different payment method. The amount returns to your wallet within 24 hours for retry.",
    keywords: ['failed', 'withdrawal failed', 'error', 'unsuccessful', 'rejected withdrawal'],
    relatedArticles: ['pay-4', 'pay-1'],
  },

  // Technical Category
  {
    id: 'tech-1',
    category: 'technical',
    question: 'App not loading properly',
    answer: "Try these steps: (1) Refresh the page, (2) Clear browser cache and cookies, (3) Try incognito/private mode, (4) Use a different browser (Chrome, Firefox, Safari recommended), (5) Check your internet connection. If issues persist, it might be a temporary server issue - try again in a few minutes.",
    keywords: ['not loading', 'slow', 'stuck', 'blank', 'error', 'crash'],
    relatedArticles: ['tech-4', 'tech-3'],
  },
  {
    id: 'tech-2',
    category: 'technical',
    question: 'Links not tracking correctly',
    answer: "For best tracking: (1) Disable ad blockers for our site, (2) Allow cookies in your browser, (3) Don't switch browsers/devices mid-purchase, (4) Complete purchase in the same session, (5) Try incognito mode with our site whitelisted. If tracking still fails, note your order details to file a dispute.",
    keywords: ['tracking', 'not tracked', 'link', 'broken', 'affiliate'],
    relatedArticles: ['cb-10', 'cb-1'],
  },
  {
    id: 'tech-3',
    category: 'technical',
    question: 'Browser compatibility',
    answer: "We support all modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Some features may not work on older browsers. Mobile browsers (Chrome, Safari) are fully supported. Internet Explorer is not supported.",
    keywords: ['browser', 'compatible', 'support', 'chrome', 'firefox', 'safari'],
    relatedArticles: ['tech-1', 'tech-4'],
  },
  {
    id: 'tech-4',
    category: 'technical',
    question: 'How to clear cache',
    answer: "Chrome: Ctrl+Shift+Delete > Clear browsing data. Firefox: Ctrl+Shift+Delete > Clear Now. Safari: Preferences > Privacy > Manage Website Data. You can also use incognito mode for a fresh session without clearing your cache.",
    keywords: ['cache', 'clear', 'cookies', 'reset', 'refresh'],
    relatedArticles: ['tech-1', 'tech-2'],
  },
  {
    id: 'tech-5',
    category: 'technical',
    question: 'Notifications not working',
    answer: "Check that: (1) Browser notifications are enabled for our site, (2) Email notifications are turned on in Profile > Settings, (3) Check spam folder for emails, (4) Ensure push notifications are allowed on your device. You can customize which notifications you receive in settings.",
    keywords: ['notifications', 'alerts', 'email', 'push', 'not receiving'],
    relatedArticles: ['acc-1'],
  },

  // General Category
  {
    id: 'gen-1',
    category: 'general',
    question: 'How does cashback work?',
    answer: "It's simple: (1) Browse offers on our platform, (2) Click through to the brand's site using our link, (3) Shop as normal and complete your purchase, (4) We receive a commission from the brand, (5) We share a portion of that commission with you as cashback. It's completely free to use!",
    keywords: ['how', 'work', 'explain', 'process', 'what is cashback'],
    relatedArticles: ['cb-10', 'gen-2'],
  },
  {
    id: 'gen-2',
    category: 'general',
    question: "Why is this free? What's the catch?",
    answer: "There's no catch! Brands pay us a commission for referring customers. We share that commission with you as cashback. You pay nothing extra - in fact, you save money. We earn when you earn, creating a win-win relationship.",
    keywords: ['free', 'catch', 'scam', 'legitimate', 'how make money'],
    relatedArticles: ['gen-1'],
  },
  {
    id: 'gen-3',
    category: 'general',
    question: 'Which brands are available?',
    answer: "We partner with 500+ top brands across categories: Fashion (Myntra, Ajio), Electronics (Amazon, Flipkart), Food (Swiggy, Zomato), Travel (MakeMyTrip, Booking.com), and many more. New brands are added weekly - check the Offers page for the latest.",
    keywords: ['brands', 'stores', 'partners', 'available', 'which'],
    relatedArticles: ['gen-4'],
  },
  {
    id: 'gen-4',
    category: 'general',
    question: 'How do I find the best deals?',
    answer: "Use our filters to sort by: highest cashback %, trending offers, or category. Enable deal alerts for your favorite brands. Premium members get early access to exclusive offers. Check the 'Hot Deals' section for limited-time elevated cashback rates.",
    keywords: ['deals', 'best', 'find', 'search', 'offers', 'highest'],
    relatedArticles: ['gen-3', 'acc-4'],
  },
  {
    id: 'gen-5',
    category: 'general',
    question: 'Can I combine cashback with coupons?',
    answer: "Yes! You can use coupons listed on our offer pages alongside cashback. External coupons (from other sites) may disable tracking. Store credit cards and payment offers usually stack with cashback too.",
    keywords: ['combine', 'coupon', 'code', 'discount', 'stack', 'promo'],
    relatedArticles: ['cb-10', 'cb-4'],
  },
  {
    id: 'gen-6',
    category: 'general',
    question: 'Is my data safe?',
    answer: "Absolutely. We use bank-grade encryption (256-bit SSL) for all data. We never store complete payment details. Your shopping history is private and never shared. We're GDPR compliant and you can request data deletion anytime.",
    keywords: ['safe', 'secure', 'privacy', 'data', 'protection', 'security'],
    relatedArticles: ['acc-7', 'pay-4'],
  },
];

// Search utility function
export function searchKnowledgeBase(query: string): KnowledgeArticle[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  const scoredArticles = knowledgeBase.map((article) => {
    let score = 0;

    queryWords.forEach((word) => {
      // Question match (highest weight)
      if (article.question.toLowerCase().includes(word)) {
        score += 3;
      }

      // Keywords match (medium weight)
      if (article.keywords.some((kw) => kw.toLowerCase().includes(word))) {
        score += 2;
      }

      // Answer match (lower weight)
      if (article.answer.toLowerCase().includes(word)) {
        score += 1;
      }
    });

    return { article, score };
  });

  return scoredArticles
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => item.article);
}

// Get articles by category
export function getArticlesByCategory(category: KnowledgeCategory): KnowledgeArticle[] {
  return knowledgeBase.filter((article) => article.category === category);
}

// Get category counts
export function getCategoryCounts(): Record<KnowledgeCategory, number> {
  return knowledgeBase.reduce((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {} as Record<KnowledgeCategory, number>);
}

// Get popular/featured articles
export function getPopularArticles(): KnowledgeArticle[] {
  const popularIds = ['cb-1', 'cb-2', 'pay-1', 'gen-1', 'acc-4', 'tech-2'];
  return popularIds
    .map((id) => knowledgeBase.find((a) => a.id === id))
    .filter((a): a is KnowledgeArticle => a !== undefined);
}

// Get related articles
export function getRelatedArticles(articleId: string): KnowledgeArticle[] {
  const article = knowledgeBase.find((a) => a.id === articleId);
  if (!article?.relatedArticles) return [];

  return article.relatedArticles
    .map((id) => knowledgeBase.find((a) => a.id === id))
    .filter((a): a is KnowledgeArticle => a !== undefined);
}
