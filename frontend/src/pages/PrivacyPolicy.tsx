import { MainLayout } from "@/components/layout/MainLayout";

export default function PrivacyPolicy() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last Updated: September 28, 2025
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="container py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              ADSSIMSIM ("we," "our," "us") respects your privacy and is fully committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, protect, and share your information when you use our website, mobile application, and services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using ADSSIMSIM, you agree to the practices described in this Privacy Policy.
            </p>

            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">1. WHO WE ARE</h2>
              <p className="text-muted-foreground leading-relaxed">
                ADSSIMSIM is a cashback, discounts, and customer analytics platform that connects users with partner brands. We:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>Provide cashback and discount offers to users</li>
                <li>Track eligible transactions</li>
                <li>Share aggregated and anonymized customer behavior insights with partner businesses</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We act only as a marketing and technology facilitator and are not the seller or service provider of listed products.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">2. INFORMATION WE COLLECT</h2>
              
              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium">A. Personal Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                  <li>Full Name</li>
                  <li>Email Address</li>
                  <li>Mobile Number</li>
                  <li>Date of Birth (optional)</li>
                  <li>Bank Account / UPI details (for cashback payouts)</li>
                  <li>Identity details (only if legally required for compliance)</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium">B. Technical & Device Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                  <li>Browser Type</li>
                  <li>Device Type</li>
                  <li>Operating System</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium">C. Transaction & Cashback Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                  <li>Click tracking</li>
                  <li>Purchase value</li>
                  <li>Cashback earned</li>
                  <li>Cashback status (Pending, Approved, Rejected)</li>
                  <li>Refunds and cancellations</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium">D. Behavioral & Analytics Data</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                  <li>Offer browsing patterns</li>
                  <li>Product/category preferences</li>
                  <li>Purchase frequency</li>
                  <li>Engagement data</li>
                  <li>City or regional location data (not exact address)</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">3. HOW WE USE YOUR INFORMATION</h2>
              <p className="text-muted-foreground leading-relaxed">Your information is used for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>Tracking and validating cashback</li>
                <li>Processing payouts</li>
                <li>Improving platform functionality</li>
                <li>Personalizing offers</li>
                <li>Detecting fraud and misuse</li>
                <li>Customer support</li>
                <li>Compliance with legal obligations</li>
                <li>Providing aggregated, anonymized analytics to partner businesses</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">4. SHARING OF INFORMATION</h2>
              <p className="text-muted-foreground leading-relaxed">We may share limited information with:</p>
              
              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium">A. Partner Merchants</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                  <li>Order confirmation</li>
                  <li>Transaction identifiers</li>
                  <li>Cashback eligibility</li>
                </ul>
                <p className="text-muted-foreground flex items-center gap-2">
                  <span className="text-destructive">❌</span> We do NOT share your phone number, email, or bank details with merchants.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium">B. Financial & Payment Partners</h3>
                <p className="text-muted-foreground pl-4">Only for processing cashback withdrawals.</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium">C. Legal Authorities</h3>
                <p className="text-muted-foreground pl-4">Only when required by law, regulation, or court order.</p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">5. DATA ANALYTICS & BUSINESS INSIGHTS</h2>
              <p className="text-muted-foreground leading-relaxed">ADSSIMSIM uses customer activity to generate:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>Market performance analytics</li>
                <li>Spending and engagement trends</li>
                <li>Regional buying behavior</li>
              </ul>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="text-primary">✅</span> These reports are fully anonymized and statistical. No user identity is ever disclosed.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">6. DATA SECURITY</h2>
              <p className="text-muted-foreground leading-relaxed">We use industry-standard security practices including:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>SSL encryption</li>
                <li>Secure servers</li>
                <li>Restricted access control</li>
                <li>Encrypted storage</li>
                <li>Regular monitoring and security updates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                While no system is 100% secure, we apply maximum reasonable protection.
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">7. COOKIES & TRACKING TECHNOLOGY</h2>
              <p className="text-muted-foreground leading-relaxed">We use cookies and tracking tools to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>Track affiliate sales</li>
                <li>Maintain user login sessions</li>
                <li>Improve site performance</li>
                <li>Personalize offers</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                You can manage cookie preferences through your browser settings.
              </p>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">8. USER RIGHTS</h2>
              <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>Access your data</li>
                <li>Correct inaccurate information</li>
                <li>Withdraw consent</li>
                <li>Request account deletion</li>
                <li>Opt out of marketing messages</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                You may raise requests at: 📧 <a href="mailto:adssimsim@gmail.com" className="text-primary hover:underline">adssimsim@gmail.com</a>
              </p>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">9. DATA RETENTION</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain data only as long as necessary for business, tax, legal, and fraud-prevention purposes.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Inactive accounts and non-essential data may be removed after a certain period.
              </p>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">10. CHILDREN'S PRIVACY</h2>
              <p className="text-muted-foreground leading-relaxed">
                ADSSIMSIM does not knowingly collect personal data of individuals under 18 years. If detected, such data will be immediately deleted.
              </p>
            </div>

            {/* Section 11 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">11. CROSS-BORDER DATA TRANSFER</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any data is transferred outside India, it will be protected using international compliance standards and safeguards.
              </p>
            </div>

            {/* Section 12 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">12. LIMITATION OF LIABILITY</h2>
              <p className="text-muted-foreground leading-relaxed">ADSSIMSIM is not responsible for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>Product quality</li>
                <li>Delivery delays</li>
                <li>Warranty issues</li>
                <li>Refund disputes</li>
                <li>Cashback delays caused by partner systems</li>
                <li>Cyber incidents beyond reasonable control</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                All product-related concerns must be resolved with the respective merchant.
              </p>
            </div>

            {/* Section 13 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">13. DATA OWNERSHIP & INTELLECTUAL PROPERTY</h2>
              <p className="text-muted-foreground leading-relaxed">
                All platform technology, cashback systems, analytics engines, dashboards, user behavior intelligence, and reporting formats are the exclusive intellectual property of ADSSIMSIM.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Partners receive restricted, non-transferable access to aggregated insights only.
              </p>
            </div>

            {/* Section 14 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">14. POLICY UPDATES</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. Any changes will be published on this page. Continued use of the platform means acceptance of revised terms.
              </p>
            </div>

            {/* Section 15 */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">15. CONTACT INFORMATION</h2>
              <p className="text-muted-foreground leading-relaxed">For privacy-related concerns:</p>
              <div className="text-muted-foreground leading-relaxed pl-4">
                <p className="font-medium text-foreground">Privacy Officer – ADSSIMSIM</p>
                <p>📧 <a href="mailto:adssimsim@gmail.com" className="text-primary hover:underline">adssimsim@gmail.com</a></p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
