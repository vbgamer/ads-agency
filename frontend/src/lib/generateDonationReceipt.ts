import { jsPDF } from "jspdf";
import { format } from "date-fns";

interface DonationReceiptData {
  donorName: string;
  donorEmail: string;
  transactionId: string;
  amount: number;
  currency: string;
  date: string;
  cardLastFour?: string;
}

interface DonationSummaryData {
  donorName: string;
  donorEmail: string;
  donations: Array<{
    id: string;
    amount: number;
    created_at: string;
  }>;
  currency: string;
}

export function generateDonationReceipt(donation: DonationReceiptData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(219, 39, 119); // Pink color
  doc.text("Donation Receipt", 105, 30, { align: "center" });
  
  // App name/logo placeholder
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for supporting our platform!", 105, 40, { align: "center" });
  
  // Divider line
  doc.setDrawColor(219, 39, 119);
  doc.line(20, 50, 190, 50);
  
  // Receipt details
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  
  const startY = 65;
  const lineHeight = 10;
  
  doc.text("Receipt Number:", 20, startY);
  doc.setTextColor(0, 0, 0);
  doc.text(donation.transactionId.slice(0, 8).toUpperCase(), 80, startY);
  
  doc.setTextColor(60, 60, 60);
  doc.text("Date:", 20, startY + lineHeight);
  doc.setTextColor(0, 0, 0);
  doc.text(format(new Date(donation.date), "MMMM dd, yyyy 'at' h:mm a"), 80, startY + lineHeight);
  
  doc.setTextColor(60, 60, 60);
  doc.text("Donor Name:", 20, startY + lineHeight * 2);
  doc.setTextColor(0, 0, 0);
  doc.text(donation.donorName, 80, startY + lineHeight * 2);
  
  doc.setTextColor(60, 60, 60);
  doc.text("Email:", 20, startY + lineHeight * 3);
  doc.setTextColor(0, 0, 0);
  doc.text(donation.donorEmail, 80, startY + lineHeight * 3);
  
  if (donation.cardLastFour) {
    doc.setTextColor(60, 60, 60);
    doc.text("Payment Method:", 20, startY + lineHeight * 4);
    doc.setTextColor(0, 0, 0);
    doc.text(`Card ending in ${donation.cardLastFour}`, 80, startY + lineHeight * 4);
  }
  
  // Amount box
  doc.setFillColor(252, 231, 243); // Light pink
  doc.roundedRect(20, startY + lineHeight * 5.5, 170, 25, 3, 3, "F");
  
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Amount Donated:", 30, startY + lineHeight * 6.5);
  
  doc.setFontSize(20);
  doc.setTextColor(219, 39, 119);
  doc.text(`${donation.currency}${donation.amount.toLocaleString()}`, 160, startY + lineHeight * 6.5, { align: "right" });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text("This receipt confirms your generous donation.", 105, 250, { align: "center" });
  doc.text("Thank you for supporting our developer community!", 105, 258, { align: "center" });
  
  // Save the PDF
  const fileName = `donation-receipt-${donation.transactionId.slice(0, 8)}.pdf`;
  doc.save(fileName);
}

export function generateDonationSummary(data: DonationSummaryData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(219, 39, 119);
  doc.text("Donation Summary", 105, 25, { align: "center" });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy")}`, 105, 35, { align: "center" });
  
  // Donor info
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Donor: ${data.donorName}`, 20, 50);
  doc.text(`Email: ${data.donorEmail}`, 20, 58);
  
  // Total summary box
  const totalAmount = data.donations.reduce((sum, d) => sum + d.amount, 0);
  doc.setFillColor(252, 231, 243);
  doc.roundedRect(20, 65, 170, 20, 3, 3, "F");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("Total Contributions:", 30, 78);
  doc.setFontSize(16);
  doc.setTextColor(219, 39, 119);
  doc.text(`${data.currency}${totalAmount.toLocaleString()}`, 160, 78, { align: "right" });
  
  // Table header
  doc.setFillColor(244, 244, 245);
  doc.rect(20, 95, 170, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Date", 25, 102);
  doc.text("Receipt #", 80, 102);
  doc.text("Amount", 160, 102, { align: "right" });
  
  // Table rows
  let y = 115;
  doc.setTextColor(0, 0, 0);
  data.donations.forEach((donation) => {
    if (y > 270) {
      doc.addPage();
      y = 30;
    }
    doc.text(format(new Date(donation.created_at), "MMM dd, yyyy"), 25, y);
    doc.text(donation.id.slice(0, 8).toUpperCase(), 80, y);
    doc.text(`${data.currency}${donation.amount.toLocaleString()}`, 160, y, { align: "right" });
    y += 10;
  });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  const footerY = Math.min(y + 20, 285);
  doc.text(`${data.donations.length} donation(s) on record`, 105, footerY, { align: "center" });
  
  doc.save(`donation-summary-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
