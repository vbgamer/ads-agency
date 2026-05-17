import { MainLayout } from "@/components/layout/MainLayout";

export default function Terms() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground text-lg">
              Last Updated: September 28, 2025
            </p>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-8">
                These Terms & Conditions ("Terms") govern your access to and use of the services provided by ADSSIMSIM ("we", "our", "us"). By registering, accessing, or using our platform, you agree to be legally bound by these Terms.
              </p>
              <p className="text-muted-foreground mb-8 font-medium">
                If you do not agree with these Terms, please do not use our services.
              </p>

              {/* Section 1 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">1. ABOUT ADSSIMSIM</h2>
                <p className="text-muted-foreground">
                  ADSSIMSIM is a cashback, discount, and customer analytics platform that connects users with partner merchants offering products and services. We act solely as a facilitator and marketing affiliate. We are not the seller, manufacturer, service provider, or delivery agent of any product or service listed on our platform.
                </p>
              </div>

              {/* Section 2 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">2. ELIGIBILITY</h2>
                <p className="text-muted-foreground mb-2">To use ADSSIMSIM:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>You must be 18 years or older</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You must not be prohibited from using digital services under any applicable law</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">3. USER ACCOUNT</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                  <li>You are fully responsible for all activities under your account.</li>
                  <li>ADSSIMSIM reserves the right to suspend or terminate accounts found involved in fraud, misuse, or violation of these Terms.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">4. CASHBACK & DISCOUNT POLICY</h2>
                <p className="text-muted-foreground mb-2">
                  Cashback is offered only on eligible transactions tracked through ADSSIMSIM links or tools. Cashback status may be:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>Pending</li>
                  <li>Approved</li>
                  <li>Rejected</li>
                </ul>
                <p className="text-muted-foreground mb-2">
                  Cashback becomes withdrawable only after merchant confirmation. Cashback can be cancelled or reversed in case of:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>Order cancellation</li>
                  <li>Product return</li>
                  <li>Payment failure</li>
                  <li>Violation of merchant policies</li>
                </ul>
                <p className="text-muted-foreground">
                  ADSSIMSIM is not responsible for delays caused by partner systems.
                </p>
              </div>

              {/* Section 5 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">5. PAYOUT & WITHDRAWAL</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Users must provide valid bank account or UPI details.</li>
                  <li>Minimum withdrawal limits may apply.</li>
                  <li>ADSSIMSIM is not responsible for incorrect payout due to wrong banking details submitted by users.</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">6. THIRD-PARTY PRODUCTS & SERVICES</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>All products and services listed belong to third-party merchants.</li>
                  <li>ADSSIMSIM does not guarantee quality, delivery, warranty, pricing, or performance.</li>
                  <li>Any disputes regarding products or services must be resolved directly with the merchant.</li>
                </ul>
              </div>

              {/* Section 7 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">7. USER OBLIGATIONS</h2>
                <p className="text-muted-foreground mb-2">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>Create fake accounts</li>
                  <li>Generate fake transactions</li>
                  <li>Manipulate tracking systems</li>
                  <li>Use bots, scripts, or automation</li>
                  <li>Misuse referral programs</li>
                  <li>Engage in illegal or fraudulent activity</li>
                </ul>
                <p className="text-muted-foreground mb-2">Violation may lead to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Account termination</li>
                  <li>Cashback forfeiture</li>
                  <li>Legal action if required</li>
                </ul>
              </div>

              {/* Section 8 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">8. PLATFORM INTELLECTUAL PROPERTY</h2>
                <p className="text-muted-foreground mb-2">
                  All content, software, logos, data systems, cashback algorithms, dashboards, UI/UX, analytics models, and reporting formats are the exclusive intellectual property of ADSSIMSIM. You may not:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Copy</li>
                  <li>Modify</li>
                  <li>Reverse engineer</li>
                  <li>Redistribute</li>
                  <li>White-label</li>
                  <li>Create derivative platforms</li>
                </ul>
              </div>

              {/* Section 9 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">9. DATA USAGE & ANALYTICS</h2>
                <p className="text-muted-foreground mb-2">By using ADSSIMSIM, you consent that:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Your transactions may be tracked for cashback and analytics.</li>
                  <li>Your data may be used for aggregated, anonymized business insights.</li>
                  <li>No personally identifiable data is sold.</li>
                  <li>All behavioral analytics and business intelligence systems remain exclusive property of ADSSIMSIM.</li>
                </ul>
              </div>

              {/* Section 10 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">10. PROMOTIONAL COMMUNICATION</h2>
                <p className="text-muted-foreground mb-2">You agree that ADSSIMSIM may send:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-2">
                  <li>Offer notifications</li>
                  <li>Cashback alerts</li>
                  <li>Promotional content</li>
                </ul>
                <p className="text-muted-foreground">You may opt out at any time.</p>
              </div>

              {/* Section 11 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">11. SERVICE AVAILABILITY</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>ADSSIMSIM does not guarantee uninterrupted access.</li>
                  <li>We may suspend the platform for maintenance, upgrades, or technical issues without prior notice.</li>
                </ul>
              </div>

              {/* Section 12 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">12. TERMINATION OF SERVICE</h2>
                <p className="text-muted-foreground mb-2">ADSSIMSIM reserves the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-2">
                  <li>Suspend or terminate user accounts</li>
                  <li>Restrict platform access without prior notice for violation of these Terms.</li>
                </ul>
                <p className="text-muted-foreground">Termination does not remove liability for any prior misconduct.</p>
              </div>

              {/* Section 13 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">13. LIMITATION OF LIABILITY</h2>
                <p className="text-muted-foreground mb-2">ADSSIMSIM shall not be liable for:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Merchant service failures</li>
                  <li>Product defects</li>
                  <li>Non-delivery</li>
                  <li>Cashback rejections by partners</li>
                  <li>Data loss due to external cyberattacks</li>
                  <li>Financial losses caused by merchants</li>
                </ul>
              </div>

              {/* Section 14 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">14. INDEMNIFICATION</h2>
                <p className="text-muted-foreground mb-2">You agree to indemnify and hold harmless ADSSIMSIM from:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Violations of these Terms</li>
                  <li>Fraudulent use</li>
                  <li>Misrepresentation</li>
                  <li>Legal claims arising from your actions</li>
                </ul>
              </div>

              {/* Section 15 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">15. GOVERNING LAW & DISPUTE RESOLUTION</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>These Terms are governed by the laws of India.</li>
                  <li>Disputes shall be resolved through arbitration.</li>
                  <li>Jurisdiction shall lie exclusively with the courts of Mumbai, India.</li>
                </ul>
              </div>

              {/* Section 16 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">16. MODIFICATION OF TERMS</h2>
                <p className="text-muted-foreground">
                  ADSSIMSIM may update these Terms at any time. Continued use after modification constitutes acceptance.
                </p>
              </div>

              {/* Section 17 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">17. FORCE MAJEURE</h2>
                <p className="text-muted-foreground mb-2">
                  ADSSIMSIM shall not be liable for failure caused by events beyond control including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Natural disasters</li>
                  <li>System failures</li>
                  <li>Government restrictions</li>
                  <li>Network outages</li>
                </ul>
              </div>

              {/* Section 18 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">18. SEVERABILITY</h2>
                <p className="text-muted-foreground">
                  If any provision is held invalid, the remaining provisions shall remain in full force.
                </p>
              </div>

              {/* Section 19 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">19. CONTACT INFORMATION</h2>
                <p className="text-muted-foreground mb-2">For any legal or support queries:</p>
                <p className="text-muted-foreground font-medium">ADSSIMSIM – Legal Department</p>
                <p className="text-muted-foreground">
                  📧 <a href="mailto:adssimsim@gmail.com" className="text-primary hover:underline">adssimsim@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
