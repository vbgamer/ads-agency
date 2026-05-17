import { jsPDF } from "jspdf";
import { format } from "date-fns";

interface BaseReceiptData {
  transactionId: string;
  amount: number;
  currency: string;
  date: string;
  cardLastFour?: string;
}

interface SubscriptionReceiptData extends BaseReceiptData {
  type: "subscription";
  recipientName: string;
  recipientEmail: string;
  planName: string;
  periodStart?: string;
  periodEnd?: string;
}

interface WalletTopupReceiptData extends BaseReceiptData {
  type: "wallet_topup";
  companyName: string;
  companyEmail: string;
}

interface DonationReceiptData extends BaseReceiptData {
  type: "donation";
  donorName: string;
  donorEmail: string;
}

export type PaymentReceiptData = SubscriptionReceiptData | WalletTopupReceiptData | DonationReceiptData;

interface SubscriptionSummaryData {
  recipientName: string;
  recipientEmail: string;
  transactions: Array<{
    id: string;
    amount: number;
    created_at: string;
    card_last_four?: string;
  }>;
  currency: string;
}

interface WalletTopupSummaryData {
  companyName: string;
  companyEmail: string;
  transactions: Array<{
    id: string;
    amount: number;
    created_at: string;
    card_last_four?: string;
    description?: string;
  }>;
  currency: string;
}

// Color schemes for different payment types
const colorSchemes = {
  subscription: {
    primary: [139, 92, 246], // Purple
    light: [245, 243, 255],
    text: "Subscription Receipt",
    tagline: "Premium Membership",
  },
  wallet_topup: {
    primary: [34, 197, 94], // Green
    light: [240, 253, 244],
    text: "Wallet Top-up Receipt",
    tagline: "Cashback Pool Funding",
  },
  donation: {
    primary: [219, 39, 119], // Pink
    light: [252, 231, 243],
    text: "Donation Receipt",
    tagline: "Thank you for your support!",
  },
};

export function generatePaymentReceipt(data: PaymentReceiptData): void {
  const doc = new jsPDF();
  const colors = colorSchemes[data.type];

  // Header
  doc.setFontSize(24);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(colors.text, 105, 30, { align: "center" });

  // Tagline
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(colors.tagline, 105, 40, { align: "center" });

  // Divider line
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.line(20, 50, 190, 50);

  // Receipt details
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);

  const startY = 65;
  const lineHeight = 10;

  // Receipt Number
  doc.text("Receipt Number:", 20, startY);
  doc.setTextColor(0, 0, 0);
  doc.text(data.transactionId.slice(0, 8).toUpperCase(), 80, startY);

  // Date
  doc.setTextColor(60, 60, 60);
  doc.text("Date:", 20, startY + lineHeight);
  doc.setTextColor(0, 0, 0);
  doc.text(format(new Date(data.date), "MMMM dd, yyyy 'at' h:mm a"), 80, startY + lineHeight);

  // Recipient details based on type
  let recipientName = "";
  let recipientEmail = "";

  if (data.type === "subscription") {
    recipientName = data.recipientName;
    recipientEmail = data.recipientEmail;
  } else if (data.type === "wallet_topup") {
    recipientName = data.companyName;
    recipientEmail = data.companyEmail;
  } else {
    recipientName = data.donorName;
    recipientEmail = data.donorEmail;
  }

  doc.setTextColor(60, 60, 60);
  doc.text(data.type === "wallet_topup" ? "Company:" : "Name:", 20, startY + lineHeight * 2);
  doc.setTextColor(0, 0, 0);
  doc.text(recipientName, 80, startY + lineHeight * 2);

  doc.setTextColor(60, 60, 60);
  doc.text("Email:", 20, startY + lineHeight * 3);
  doc.setTextColor(0, 0, 0);
  doc.text(recipientEmail, 80, startY + lineHeight * 3);

  let currentLine = 4;

  // Payment method if available
  if (data.cardLastFour) {
    doc.setTextColor(60, 60, 60);
    doc.text("Payment Method:", 20, startY + lineHeight * currentLine);
    doc.setTextColor(0, 0, 0);
    doc.text(`Card ending in ${data.cardLastFour}`, 80, startY + lineHeight * currentLine);
    currentLine++;
  }

  // Type-specific details
  if (data.type === "subscription") {
    doc.setTextColor(60, 60, 60);
    doc.text("Plan:", 20, startY + lineHeight * currentLine);
    doc.setTextColor(0, 0, 0);
    doc.text(data.planName, 80, startY + lineHeight * currentLine);
    currentLine++;

    if (data.periodStart && data.periodEnd) {
      doc.setTextColor(60, 60, 60);
      doc.text("Validity:", 20, startY + lineHeight * currentLine);
      doc.setTextColor(0, 0, 0);
      const start = format(new Date(data.periodStart), "MMM dd, yyyy");
      const end = format(new Date(data.periodEnd), "MMM dd, yyyy");
      doc.text(`${start} - ${end}`, 80, startY + lineHeight * currentLine);
      currentLine++;
    }
  } else if (data.type === "wallet_topup") {
    doc.setTextColor(60, 60, 60);
    doc.text("Purpose:", 20, startY + lineHeight * currentLine);
    doc.setTextColor(0, 0, 0);
    doc.text("Cashback Pool Funding", 80, startY + lineHeight * currentLine);
    currentLine++;
  }

  // Amount box
  const amountBoxY = startY + lineHeight * (currentLine + 1);
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(20, amountBoxY, 170, 25, 3, 3, "F");

  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Amount:", 30, amountBoxY + 16);

  doc.setFontSize(20);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(`${data.currency}${data.amount.toLocaleString()}`, 160, amountBoxY + 16, { align: "right" });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  
  const footerMessages = {
    subscription: ["This receipt confirms your premium subscription payment.", "Enjoy your premium benefits!"],
    wallet_topup: ["This receipt confirms your wallet top-up transaction.", "Funds have been added to your cashback pool."],
    donation: ["This receipt confirms your generous donation.", "Thank you for supporting our developer community!"],
  };

  doc.text(footerMessages[data.type][0], 105, 250, { align: "center" });
  doc.text(footerMessages[data.type][1], 105, 258, { align: "center" });

  // Save the PDF
  const fileName = `${data.type}-receipt-${data.transactionId.slice(0, 8)}.pdf`;
  doc.save(fileName);
}

export function generateSubscriptionSummary(data: SubscriptionSummaryData): void {
  const doc = new jsPDF();
  const colors = colorSchemes.subscription;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Subscription Payment Summary", 105, 25, { align: "center" });

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy")}`, 105, 35, { align: "center" });

  // Recipient info
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${data.recipientName}`, 20, 50);
  doc.text(`Email: ${data.recipientEmail}`, 20, 58);

  // Total summary box
  const totalAmount = data.transactions.reduce((sum, t) => sum + t.amount, 0);
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(20, 65, 170, 20, 3, 3, "F");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("Total Payments:", 30, 78);
  doc.setFontSize(16);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(`${data.currency}${totalAmount.toLocaleString()}`, 160, 78, { align: "right" });

  // Table header
  doc.setFillColor(244, 244, 245);
  doc.rect(20, 95, 170, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Date", 25, 102);
  doc.text("Receipt #", 80, 102);
  doc.text("Payment Method", 115, 102);
  doc.text("Amount", 165, 102, { align: "right" });

  // Table rows
  let y = 115;
  doc.setTextColor(0, 0, 0);
  data.transactions.forEach((tx) => {
    if (y > 270) {
      doc.addPage();
      y = 30;
    }
    doc.text(format(new Date(tx.created_at), "MMM dd, yyyy"), 25, y);
    doc.text(tx.id.slice(0, 8).toUpperCase(), 80, y);
    doc.text(tx.card_last_four ? `****${tx.card_last_four}` : "N/A", 115, y);
    doc.text(`${data.currency}${tx.amount.toLocaleString()}`, 165, y, { align: "right" });
    y += 10;
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  const footerY = Math.min(y + 20, 285);
  doc.text(`${data.transactions.length} payment(s) on record`, 105, footerY, { align: "center" });

  doc.save(`subscription-summary-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateWalletTopupSummary(data: WalletTopupSummaryData): void {
  const doc = new jsPDF();
  const colors = colorSchemes.wallet_topup;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Wallet Top-up Summary", 105, 25, { align: "center" });

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy")}`, 105, 35, { align: "center" });

  // Company info
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Company: ${data.companyName}`, 20, 50);
  doc.text(`Email: ${data.companyEmail}`, 20, 58);

  // Total summary box
  const totalAmount = data.transactions.reduce((sum, t) => sum + t.amount, 0);
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(20, 65, 170, 20, 3, 3, "F");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("Total Added:", 30, 78);
  doc.setFontSize(16);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(`${data.currency}${totalAmount.toLocaleString()}`, 160, 78, { align: "right" });

  // Table header
  doc.setFillColor(244, 244, 245);
  doc.rect(20, 95, 170, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Date", 25, 102);
  doc.text("Receipt #", 70, 102);
  doc.text("Description", 105, 102);
  doc.text("Amount", 165, 102, { align: "right" });

  // Table rows
  let y = 115;
  doc.setTextColor(0, 0, 0);
  data.transactions.forEach((tx) => {
    if (y > 270) {
      doc.addPage();
      y = 30;
    }
    doc.text(format(new Date(tx.created_at), "MMM dd, yyyy"), 25, y);
    doc.text(tx.id.slice(0, 8).toUpperCase(), 70, y);
    doc.text(tx.description || "Wallet Top-up", 105, y);
    doc.text(`${data.currency}${tx.amount.toLocaleString()}`, 165, y, { align: "right" });
    y += 10;
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  const footerY = Math.min(y + 20, 285);
  doc.text(`${data.transactions.length} top-up(s) on record`, 105, footerY, { align: "center" });

  doc.save(`wallet-topup-summary-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
