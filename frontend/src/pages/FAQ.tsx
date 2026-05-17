import { MainLayout } from "@/components/layout/MainLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "What is this cashback program?",
    answer: "We believe in rewarding our customers directly. Instead of spending on traditional advertising, we transfer the marketing budget to you as cashback whenever you shop through our platform."
  },
  {
    question: "How does it work?",
    answer: "It's simple:\n• Browse the offers and click on a product/service link.\n• Complete your purchase on the partner company's official website.\n• Once your payment is confirmed, cashback is credited to your account."
  },
  {
    question: "Is the cashback real money?",
    answer: "Yes. The cashback you earn is real money. You can withdraw it directly to your bank/UPI account or use it as wallet balance, depending on your preference."
  },
  {
    question: "How much cashback can I earn?",
    answer: "Cashback rates vary depending on the product, service, or campaign. Each offer clearly shows the percentage or amount you'll receive before you make a purchase."
  },
  {
    question: "When will I receive my cashback?",
    answer: "Most cashbacks are credited within 24–72 hours of purchase confirmation. In some cases, especially for returns or order verifications, it may take up to 7 working days."
  },
  {
    question: "Are there any limits on cashback?",
    answer: "Yes, some campaigns may have daily, monthly, or per-transaction limits. These limits will always be mentioned in the offer details."
  },
  {
    question: "Who is eligible for cashback?",
    answer: "All registered users who make a purchase through our platform are eligible. Some campaigns may be exclusive to new customers or specific regions—these details will be mentioned clearly."
  },
  {
    question: "Do I need to sign up?",
    answer: "Yes. You must create a free account and verify your mobile/email so we can track your cashback and transfer the reward securely."
  },
  {
    question: "Can I earn cashback on every purchase?",
    answer: "Cashback is available only on products and services listed on our platform. If a product is not listed, it will not qualify for cashback."
  },
  {
    question: "How is this different from regular discounts?",
    answer: "Discounts reduce the price at checkout. Our cashback model rewards you after purchase by giving you a share of the marketing budget directly."
  },
  {
    question: "Is this safe and legal?",
    answer: "Absolutely. All transactions are secure, and cashback transfers are 100% legal. We comply with financial and data-privacy regulations to ensure your safety."
  },
  {
    question: "What if I don't receive my cashback?",
    answer: "If your cashback doesn't appear within the expected time, you can raise a support ticket from your account dashboard. Our team will track and resolve it quickly."
  },
  {
    question: "Can I combine cashback with other offers?",
    answer: "Yes, in most cases you can. However, some campaigns may restrict combining with coupons or discounts. Check the offer details before purchase."
  },
  {
    question: "What if I return or cancel my order?",
    answer: "If your order is cancelled or returned, the cashback for that transaction will not be credited or will be reversed if already paid."
  }
];

const FAQ = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about our cashback program
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg px-6 bg-card"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default FAQ;
